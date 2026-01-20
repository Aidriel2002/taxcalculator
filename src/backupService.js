import { supabase } from './supabaseClient';

const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

const verifyPassword = async (password, hash) => {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
};

export const saveToDatabase = async (backupName, password, history, projects) => {
  try {
    if (!backupName || !password) {
      throw new Error('Backup name and password are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const passwordHash = await hashPassword(password);

    const { data: existingBackup, error: checkError } = await supabase
      .from('named_backups')
      .select('*')
      .eq('backup_name', backupName)
      .maybeSingle();

    if (checkError) throw checkError;

    let backupId;

    if (existingBackup) {
      const isValid = await verifyPassword(password, existingBackup.password_hash);
      if (!isValid) {
        throw new Error('Incorrect password for this backup name');
      }
      backupId = existingBackup.id;
    } else {
      const { data: newBackup, error: backupError } = await supabase
        .from('named_backups')
        .insert([{ 
          backup_name: backupName, 
          password_hash: passwordHash 
        }])
        .select()
        .single();

      if (backupError) {
        if (backupError.code === '23505') {
          throw new Error('This backup name is already taken. Please choose a different name.');
        }
        throw backupError;
      }
      backupId = newBackup.id;
    }

    const { data: existingProjects } = await supabase
      .from('backup_projects')
      .select('project_id, id')
      .eq('backup_id', backupId);

    const { data: existingCalculations } = await supabase
      .from('backup_calculations')
      .select('calculation_id')
      .eq('backup_id', backupId);

    const existingProjectMap = {};
    (existingProjects || []).forEach(p => {
      existingProjectMap[p.project_id] = p.id;
    });

    const existingCalcIds = new Set(
      (existingCalculations || []).map(c => c.calculation_id)
    );

    const projectIdMap = {}; 
    for (const project of projects) {
      if (existingProjectMap[project.id]) {
        projectIdMap[project.id] = existingProjectMap[project.id];
      } else {
        const { data, error } = await supabase
          .from('backup_projects')
          .insert([{
            backup_id: backupId,
            project_id: project.id,
            name: project.name
          }])
          .select()
          .single();

        if (!error && data) {
          projectIdMap[project.id] = data.id;
        }
      }
    }

    let newCalculationsCount = 0;
    for (const calc of history) {
      if (!existingCalcIds.has(calc.id)) {
        const backupProjectId = calc.inputs.projectId 
          ? projectIdMap[calc.inputs.projectId] 
          : null;

        const insertData = {
          backup_id: backupId,
          backup_project_id: backupProjectId,
          calculation_id: calc.id,
          project_name: calc.inputs.projectName || null,
          abc: parseFloat(calc.inputs.abc) || 0,
          expenses_vat_inc: parseFloat(calc.inputs.expensesVatInc) || 0,
          expenses_non_vat: parseFloat(calc.inputs.expensesNonVat) || 0,
          net_income_after_tax: parseFloat(calc.results.netIncomeAfterTax) || 0,
          results: calc.results,
          timestamp: calc.timestamp
        };

        const { error: calcError } = await supabase
          .from('backup_calculations')
          .insert([insertData]);
        
        if (calcError) {
          console.error('Error inserting calculation:', calc.id, calcError);
          console.error('Data attempted:', insertData);
        } else {
          newCalculationsCount++;
        }
      }
    }

    await supabase
      .from('named_backups')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', backupId);

    return {
      success: true,
      message: existingBackup 
        ? `Updated backup "${backupName}". Added ${newCalculationsCount} new calculations.`
        : `Created new backup "${backupName}" with ${history.length} calculations.`,
      isNewBackup: !existingBackup,
      newCalculationsAdded: newCalculationsCount
    };

  } catch (error) {
    console.error('Error saving to database:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
export const importFromDatabase = async (backupName, password) => {
  try {
    if (!backupName || !password) {
      throw new Error('Backup name and password are required');
    }

    const { data: backup, error: backupError } = await supabase
      .from('named_backups')
      .select('*')
      .eq('backup_name', backupName)
      .single();
    if (backupError || !backup) {
      throw new Error('Backup not found');
    }
    const isValid = await verifyPassword(password, backup.password_hash);
    if (!isValid) {
      throw new Error('Incorrect password');
    }

    const { data: projects, error: projectsError } = await supabase
      .from('backup_projects')
      .select('*')
      .eq('backup_id', backup.id);
    if (projectsError) throw projectsError;

    const { data: calculations, error: calculationsError } = await supabase
      .from('backup_calculations')
      .select('*')
      .eq('backup_id', backup.id)
      .order('timestamp', { ascending: false });
    if (calculationsError) throw calculationsError;

    const backupProjectIdToProjectId = {};
    (projects || []).forEach(p => {
      backupProjectIdToProjectId[p.id] = p.project_id;
    });

    const transformedProjects = (projects || []).map(p => ({
      id: p.project_id,
      name: p.name,
      createdAt: p.created_at
    }));

    const transformedHistory = (calculations || []).map(calc => ({
      id: calc.calculation_id,
      timestamp: calc.timestamp, 
      inputs: {
        abc: parseFloat(calc.abc) || 0,
        expensesVatInc: parseFloat(calc.expenses_vat_inc) || 0,
        expensesNonVat: parseFloat(calc.expenses_non_vat) || 0,
        projectName: calc.project_name || '',
        projectId: calc.backup_project_id 
          ? backupProjectIdToProjectId[calc.backup_project_id] 
          : null,
        retentionPercent: 0,
        undeclaredExpenses: 0
      },
      results: calc.results
    }));

    return {
      success: true,
      data: {
        projects: transformedProjects,
        history: transformedHistory,
        backupInfo: {
          name: backup.backup_name,
          createdAt: backup.created_at,
          updatedAt: backup.updated_at
        }
      }
    };

  } catch (error) {
    console.error('Error importing from database:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const listBackups = async () => {
  try {
    const { data, error } = await supabase
      .from('named_backups')
      .select('backup_name, created_at, updated_at')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteBackup = async (backupName, password) => {
  try {
    const { data: backup, error: backupError } = await supabase
      .from('named_backups')
      .select('*')
      .eq('backup_name', backupName)
      .single();

    if (backupError || !backup) {
      throw new Error('Backup not found');
    }
    const isValid = await verifyPassword(password, backup.password_hash);
    if (!isValid) {
      throw new Error('Incorrect password');
    }
    const { error: deleteError } = await supabase
      .from('named_backups')
      .delete()
      .eq('id', backup.id);
    if (deleteError) throw deleteError;
    return { success: true, message: `Backup "${backupName}" deleted successfully` };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
