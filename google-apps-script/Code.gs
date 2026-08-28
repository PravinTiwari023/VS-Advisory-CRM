/**
 * =========================================================================
 * VS ADVISORY CRM - GOOGLE APPS SCRIPT BACKEND REST API (v3.2)
 * =========================================================================
 * CORS-Optimized Multi-Sheet Engine (Supports both GET & POST)
 * =========================================================================
 */

function doGet(e) {
  return handleRequest(e ? e.parameter : {}, 'GET');
}

function doPost(e) {
  let payload = {};
  if (e && e.postData && e.postData.contents) {
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (err) {
      payload = e.parameter || {};
    }
  } else if (e && e.parameter) {
    payload = e.parameter;
  }
  return handleRequest(payload, 'POST');
}

function handleRequest(params, method) {
  try {
    const action = params.action || 'ping';

    if (action === 'ping') {
      const info = getSpreadsheetInfo();
      return jsonResponse({
        status: 'success',
        message: 'VS Advisory CRM Multi-Sheet Engine is online!',
        spreadsheet: info,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'getInitialData' || action === 'getLeads') {
      return getInitialData(params);
    }

    if (action === 'testSheet') {
      return testSpecificSheet(params);
    }

    if (action === 'updateLead') {
      return updateLead(params);
    }

    if (action === 'createLead') {
      return createLead(params);
    }

    if (action === 'logActivity') {
      return logActivity(params);
    }

    if (action === 'createTask') {
      return createTask(params);
    }

    if (action === 'updateTask') {
      return updateTask(params);
    }

    if (action === 'setupMasterCRM') {
      return jsonResponse(setupMasterCRM(params));
    }

    return jsonResponse({ status: 'error', message: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ 
      status: 'error', 
      message: 'Server Error: ' + err.toString(), 
      stack: err.stack 
    });
  }
}

/**
 * Extract clean Spreadsheet ID from ID or Full URL
 */
function extractSpreadsheetId(input) {
  if (!input) return "";
  let str = String(input).trim();
  const match = str.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  str = str.split('/')[0].split('?')[0].split('#')[0].trim();
  return str;
}

/**
 * Smart Spreadsheet opener (supports ID, URL, or Active Sheet)
 */
function getSpreadsheet(sheetIdOrUrl) {
  const cleanId = extractSpreadsheetId(sheetIdOrUrl);
  if (cleanId && cleanId !== "") {
    try {
      return SpreadsheetApp.openById(cleanId);
    } catch (e) {
      Logger.log("openById failed for " + cleanId + ": " + e.message);
      return null;
    }
  }
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}
  return null;
}

/**
 * Inspect tabs and headers in a spreadsheet
 */
function getSpreadsheetInfo(sheetId) {
  try {
    const ss = getSpreadsheet(sheetId);
    if (!ss) return { title: 'Unknown', id: '', tabs: [] };

    const sheets = ss.getSheets();
    const tabs = sheets.map(s => {
      const data = s.getDataRange().getValues();
      const headers = data.length > 0 ? data[0].map(String) : [];
      return {
        name: s.getName(),
        rowCount: Math.max(0, data.length - 1),
        headers: headers
      };
    });

    return {
      title: ss.getName(),
      id: ss.getId(),
      tabs: tabs
    };
  } catch (err) {
    return { title: 'Error', id: sheetId || '', tabs: [], error: err.message };
  }
}

/**
 * Test a specific Sheet ID / URL
 */
function testSpecificSheet(params) {
  const rawInput = (params.sheetId || params.spreadsheetId || "").trim();
  const sheetName = (params.sheetName || params.tabName || "").trim();

  try {
    const ss = getSpreadsheet(rawInput);
    if (!ss) {
      return jsonResponse({
        status: 'error',
        message: 'Could not access spreadsheet. Make sure ID/URL is valid and shared with your Google account.'
      });
    }

    const sheet = sheetName ? (ss.getSheetByName(sheetName) || ss.getSheets()[0]) : ss.getSheets()[0];
    if (!sheet) {
      return jsonResponse({
        status: 'error',
        message: 'Spreadsheet opened, but no sheet tabs found.'
      });
    }

    const data = sheet.getDataRange().getValues();
    const rowCount = Math.max(0, data.length - 1);

    return jsonResponse({
      status: 'success',
      spreadsheetTitle: ss.getName(),
      spreadsheetId: ss.getId(),
      tabName: sheet.getName(),
      rowCount: rowCount,
      headers: data.length > 0 ? data[0] : []
    });
  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: 'Sheet Error: ' + err.message
    });
  }
}

/**
 * Fetch all leads from MULTIPLE configured sheets dynamically
 */
function getInitialData(params) {
  let leads = [];
  const systemTabs = ["users", "activities", "tasks", "settings"];
  const diagnostics = [];
  const sheetCounts = {};

  let sheetConfigs = [];
  if (params.sheets) {
    try {
      sheetConfigs = typeof params.sheets === 'string' ? JSON.parse(params.sheets) : params.sheets;
    } catch (e) {
      diagnostics.push("Config Warning: Could not parse sheets list: " + e.message);
    }
  }

  // Fallback if no sheets parameter passed
  if (!sheetConfigs || sheetConfigs.length === 0) {
    const activeSS = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSS) {
      sheetConfigs.push({
        id: "sheet-active",
        name: activeSS.getName() || "Active Google Sheet",
        spreadsheetId: activeSS.getId(),
        tabName: "",
        enabled: true
      });
    }
  }

  let masterSS = null;

  // Process each configured sheet
  sheetConfigs.forEach((sc, sIdx) => {
    if (sc.enabled === false) {
      diagnostics.push(`Skipped "${sc.name}" (Disabled)`);
      return;
    }

    const sourceName = sc.name || ("Sheet #" + (sIdx + 1));
    const sourceColor = sc.color || "sky";

    try {
      const ss = getSpreadsheet(sc.spreadsheetId);
      if (!masterSS && ss) {
        masterSS = ss;
      }

      if (ss) {
        let sheetLeads = [];
        if (sc.tabName && sc.tabName.trim() !== "") {
          const s = ss.getSheetByName(sc.tabName.trim());
          if (s) {
            sheetLeads = readLeadsFromSheet(s, sourceName, ss.getId(), sourceColor);
          } else {
            diagnostics.push(`Tab "${sc.tabName}" not found in "${sourceName}". Scanning all tabs.`);
          }
        }

        // Auto-scan non-system tabs if no specific tab or tab had 0 rows
        if (sheetLeads.length === 0) {
          const allSheets = ss.getSheets();
          allSheets.forEach(s => {
            const tabLower = s.getName().toLowerCase().trim();
            if (!systemTabs.includes(tabLower)) {
              const rows = readLeadsFromSheet(s, sourceName, ss.getId(), sourceColor);
              sheetLeads = sheetLeads.concat(rows);
            }
          });
        }

        leads = leads.concat(sheetLeads);
        sheetCounts[sc.id || ("sheet-" + sIdx)] = sheetLeads.length;
        diagnostics.push(`✅ "${sourceName}" (${ss.getName()}): Loaded ${sheetLeads.length} leads`);
      } else {
        diagnostics.push(`❌ "${sourceName}": Could not open. Check if sheet is shared with your Google account.`);
      }
    } catch (sheetErr) {
      diagnostics.push(`❌ Error accessing "${sourceName}": ${sheetErr.message}`);
    }
  });

  // Read Master Tabs
  const targetMaster = masterSS || SpreadsheetApp.getActiveSpreadsheet();
  const users = targetMaster ? readTable(targetMaster, "Users") : [];
  const activities = targetMaster ? readTable(targetMaster, "Activities") : [];
  const tasks = targetMaster ? readTable(targetMaster, "Tasks") : [];

  return jsonResponse({
    status: 'success',
    data: {
      leads: leads,
      users: users,
      activities: activities,
      tasks: tasks,
      sheetCounts: sheetCounts,
      diagnostics: diagnostics,
      spreadsheetInfo: targetMaster ? getSpreadsheetInfo(targetMaster.getId()) : null,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Read Leads from a single sheet tab with smart Header-Row detection
 */
function readLeadsFromSheet(sheet, sourceTag, spreadsheetId, sourceColor) {
  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];

  // Find the true Header Row (scan first 5 rows)
  let headerRowIdx = 0;
  for (let r = 0; r < Math.min(5, data.length); r++) {
    const rowStr = data[r].map(c => String(c || '').toLowerCase()).join(" ");
    if (
      rowStr.includes("name") || 
      rowStr.includes("phone") || 
      rowStr.includes("email") || 
      rowStr.includes("lead_status") ||
      rowStr.includes("created_time") ||
      rowStr.includes("campaign")
    ) {
      headerRowIdx = r;
      break;
    }
  }

  const rawHeaders = data[headerRowIdx].map(h => String(h || '').trim());
  const headers = rawHeaders.map(h => h.toLowerCase().replace(/[\n\r]+/g, ' '));
  const rows = data.slice(headerRowIdx + 1);
  const leads = [];

  rows.forEach((row, idx) => {
    if (row.every(cell => cell === "" || cell === null || cell === undefined)) return;

    const leadObj = {
      sheet_source: sourceTag,
      sheet_color: sourceColor || "sky",
      spreadsheet_id: spreadsheetId,
      sheet_name: sheet.getName(),
      row_index: headerRowIdx + idx + 2
    };

    headers.forEach((h, colIdx) => {
      let val = row[colIdx];
      if (val instanceof Date) val = val.toISOString();
      leadObj[h] = val !== undefined && val !== null ? String(val).trim() : "";
    });

    if (!leadObj.full_name) {
      leadObj.full_name = 
        leadObj['full_name'] || 
        leadObj['full name'] || 
        leadObj['name'] || 
        leadObj['first_name'] || 
        leadObj['customer name'] || 
        leadObj['lead name'] || 
        "";
      
      if (!leadObj.full_name) {
        for (let c = 0; c < row.length; c++) {
          const cellStr = String(row[c] || '').trim();
          if (cellStr.length > 2 && !cellStr.includes("@") && isNaN(Number(cellStr))) {
            leadObj.full_name = cellStr;
            break;
          }
        }
      }

      if (!leadObj.full_name) {
        leadObj.full_name = "Lead #" + (idx + 1);
      }
    }

    if (!leadObj.phone_number) {
      leadObj.phone_number = 
        leadObj['phone_number'] || 
        leadObj['phone number'] || 
        leadObj['phone'] || 
        leadObj['mobile'] || 
        leadObj['contact'] || 
        leadObj['whatsapp'] || 
        "";
    }

    if (!leadObj.email) {
      leadObj.email = 
        leadObj['email'] || 
        leadObj['email address'] || 
        leadObj['email_address'] || 
        "";
    }

    if (!leadObj.lead_status || leadObj.lead_status.trim() === "") {
      leadObj.lead_status = 
        leadObj['lead_status'] || 
        leadObj['stage'] || 
        leadObj['status'] || 
        leadObj['crm_stage'] || 
        "New Lead";
    }

    if (!leadObj['which_configuration_are_you_interested_in?']) {
      leadObj['which_configuration_are_you_interested_in?'] = 
        leadObj['which_configuration_are_you_interested_in?'] ||
        leadObj['configuration'] ||
        leadObj['service'] ||
        leadObj['interested in'] ||
        "";
    }

    if (!leadObj['what_is_your_budget?']) {
      leadObj['what_is_your_budget?'] = 
        leadObj['what_is_your_budget?'] ||
        leadObj['budget'] ||
        leadObj['price range'] ||
        "";
    }

    if (!leadObj.id || leadObj.id.trim() === "") {
      leadObj.id = "LEAD-" + (sourceTag.replace(/[^a-zA-Z0-9]/g, '')) + "-" + (idx + 2);
    }

    leads.push(leadObj);
  });

  return leads;
}

function updateLead(payload) {
  const spreadsheetId = payload.spreadsheet_id;
  const ss = getSpreadsheet(spreadsheetId);
  if (!ss) return jsonResponse({ status: 'error', message: 'Target spreadsheet not found' });

  const sheet = payload.sheet_name ? (ss.getSheetByName(payload.sheet_name) || ss.getSheets()[0]) : ss.getSheets()[0];
  if (!sheet) return jsonResponse({ status: 'error', message: 'Target sheet tab not found' });

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h || '').trim().toLowerCase());
  let targetRowIndex = payload.row_index;

  if (!targetRowIndex || targetRowIndex < 2 || targetRowIndex > data.length) {
    const idIdx = headers.indexOf("id");
    const phoneIdx = headers.indexOf("phone_number");
    for (let r = 1; r < data.length; r++) {
      if (idIdx !== -1 && String(data[r][idIdx]).trim() === String(payload.id).trim()) {
        targetRowIndex = r + 1;
        break;
      }
      if (phoneIdx !== -1 && payload.phone_number && String(data[r][phoneIdx]).trim() === String(payload.phone_number).trim()) {
        targetRowIndex = r + 1;
        break;
      }
    }
  }

  if (!targetRowIndex) return jsonResponse({ status: 'error', message: 'Lead row not found in sheet' });

  function setCell(colName, val) {
    let colIdx = headers.indexOf(colName.toLowerCase());
    if (colIdx === -1) {
      colIdx = headers.length;
      sheet.getRange(1, colIdx + 1).setValue(colName);
      headers.push(colName.toLowerCase());
    }
    sheet.getRange(targetRowIndex, colIdx + 1).setValue(val);
  }

  if (payload.lead_status !== undefined) setCell("lead_status", payload.lead_status);
  if (payload.crm_notes !== undefined) setCell("crm_notes", payload.crm_notes);
  if (payload.crm_assigned_to !== undefined) setCell("crm_assigned_to", payload.crm_assigned_to);
  if (payload.crm_deal_value !== undefined) setCell("crm_deal_value", payload.crm_deal_value);
  if (payload.crm_next_follow_up !== undefined) setCell("crm_next_follow_up", payload.crm_next_follow_up);
  if (payload.crm_last_contacted !== undefined) setCell("crm_last_contacted", payload.crm_last_contacted);
  if (payload.full_name !== undefined) setCell("full_name", payload.full_name);
  if (payload.phone_number !== undefined) setCell("phone_number", payload.phone_number);
  if (payload.email !== undefined) setCell("email", payload.email);

  return jsonResponse({ status: 'success', message: 'Row updated successfully in Google Sheet!' });
}

function createLead(payload) {
  const spreadsheetId = payload.spreadsheet_id;
  const ss = getSpreadsheet(spreadsheetId);
  if (!ss) return jsonResponse({ status: 'error', message: 'No spreadsheet found to add lead' });

  const sheet = ss.getSheets()[0];
  const data = sheet.getDataRange().getValues();
  const headers = data.length > 0 ? data[0].map(h => String(h || '').trim().toLowerCase()) : [];

  const newId = payload.id || "LEAD-MANUAL-" + Date.now();
  const newRow = new Array(headers.length).fill("");

  function fill(colName, val) {
    const idx = headers.indexOf(colName.toLowerCase());
    if (idx !== -1 && val !== undefined) newRow[idx] = val;
  }

  fill("id", newId);
  fill("created_time", new Date().toISOString());
  fill("full_name", payload.full_name || "");
  fill("phone_number", payload.phone_number || "");
  fill("email", payload.email || "");
  fill("lead_status", payload.lead_status || "New Lead");
  fill("platform", payload.platform || "Direct Entry");
  fill("campaign_name", payload.campaign_name || "Direct Advisory");
  fill("which_configuration_are_you_interested_in?", payload['which_configuration_are_you_interested_in?'] || "");
  fill("what_is_your_budget?", payload['what_is_your_budget?'] || "");
  fill("crm_notes", payload.crm_notes || "");
  fill("crm_assigned_to", payload.crm_assigned_to || "");

  sheet.appendRow(newRow);
  return jsonResponse({ status: 'success', id: newId, message: 'Lead added to sheet row #' + (sheet.getLastRow()) });
}

function logActivity(payload) {
  const ss = getSpreadsheet(payload.spreadsheet_id);
  if (!ss) return jsonResponse({ status: 'error', message: 'Spreadsheet not found' });
  let s = ss.getSheetByName("Activities") || ss.insertSheet("Activities");
  if (s.getLastRow() === 0) s.appendRow(["id", "lead_id", "type", "summary", "details", "date", "logged_by"]);
  const id = "ACT-" + Date.now();
  s.appendRow([id, payload.lead_id || "", payload.type || "Note", payload.summary || "", payload.details || "", payload.date || new Date().toISOString(), payload.logged_by || "Advisor"]);
  return jsonResponse({ status: 'success', id: id });
}

function createTask(payload) {
  const ss = getSpreadsheet(payload.spreadsheet_id);
  if (!ss) return jsonResponse({ status: 'error', message: 'Spreadsheet not found' });
  let s = ss.getSheetByName("Tasks") || ss.insertSheet("Tasks");
  if (s.getLastRow() === 0) s.appendRow(["id", "lead_id", "lead_name", "title", "description", "due_date", "priority", "status", "assigned_to"]);
  const id = "TASK-" + Date.now();
  s.appendRow([id, payload.lead_id || "", payload.lead_name || "", payload.title || "", payload.description || "", payload.due_date || "", payload.priority || "High", "Pending", payload.assigned_to || ""]);
  return jsonResponse({ status: 'success', id: id });
}

function updateTask(payload) {
  const ss = getSpreadsheet(payload.spreadsheet_id);
  if (!ss) return jsonResponse({ status: 'error', message: 'Spreadsheet not found' });
  const s = ss.getSheetByName("Tasks");
  if (!s) return jsonResponse({ status: 'error', message: 'Tasks tab not found' });
  const data = s.getDataRange().getValues();
  for (let r = 1; r < data.length; r++) {
    if (String(data[r][0]) === String(payload.id)) {
      s.getRange(r + 1, 8).setValue(payload.status);
      return jsonResponse({ status: 'success' });
    }
  }
  return jsonResponse({ status: 'error', message: 'Task not found' });
}

function readTable(ss, name) {
  const s = ss.getSheetByName(name);
  if (!s) return [];
  const data = s.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(String);
  return data.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, idx) => obj[h] = r[idx]);
    return obj;
  });
}

function setupMasterCRM(params) {
  const ss = getSpreadsheet(params ? (params.sheet1Id || params.spreadsheetId) : null);
  if (!ss) return { status: 'error', message: 'Could not access spreadsheet' };

  let u = ss.getSheetByName("Users") || ss.insertSheet("Users");
  if (u.getLastRow() === 0) {
    u.appendRow(["id", "name", "email", "pin", "role"]);
    u.appendRow(["USR-1", "Admin Advisor", "admin@vsadvisory.com", "1234", "Admin"]);
  }

  let a = ss.getSheetByName("Activities") || ss.insertSheet("Activities");
  if (a.getLastRow() === 0) a.appendRow(["id", "lead_id", "type", "summary", "details", "date", "logged_by"]);

  let t = ss.getSheetByName("Tasks") || ss.insertSheet("Tasks");
  if (t.getLastRow() === 0) t.appendRow(["id", "lead_id", "lead_name", "title", "description", "due_date", "priority", "status", "assigned_to"]);

  return { status: 'success', message: 'Master CRM sheets initialized!' };
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
