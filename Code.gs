/*******************************************************
 CHENAB ENGINEERING – GOOGLE SHEETS BACKEND
 Deploy: Deploy > New deployment > Web app
 Execute as: Me
 Who has access: Anyone with the link (or your org)
*******************************************************/

const SHEETS = {
  PARTS: "Parts",
  ASSIGNMENTS: "Assignments",
  UPDATES: "Updates"
};

const HEADERS = {
  Parts: [
    "PartID","OrderNo","Customer","PO_RFQ","PartNo","PartName","DrawingNo",
    "DrawingRev","MaterialGrade","Quantity","Application","BatchHeatNo",
    "Priority","TargetDate","Status","CreatedAt","CreatedBy"
  ],
  Assignments: [
    "AssignmentID","PartID","OrderNo","PartNo","ProcessSection","Task",
    "Department","AssignedTo","StartDate","DueDate","Status","Progress",
    "Remarks","LastUpdate","CreatedAt"
  ],
  Updates: [
    "UpdateID","AssignmentID","PartID","OrderNo","Department","UpdateDate",
    "Status","Progress","Remarks","EvidenceLink","UpdatedBy","CreatedAt"
  ]
};

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(HEADERS).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.getRange(1,1,1,HEADERS[name].length).setValues([HEADERS[name]]);
      sh.setFrozenRows(1);
    }
  });
  return "Setup completed";
}

function doGet(e) {
  try {
    setup();
    const p = e.parameter || {};
    const action = p.action || "health";
    let result;

    switch (action) {
      case "health":
        result = {ok:true, message:"Chenab Engineering API is running"};
        break;
      case "registerPart":
        result = registerPart_(p);
        break;
      case "listParts":
        result = listParts_();
        break;
      case "assignWork":
        result = assignWork_(p);
        break;
      case "listAssignments":
        result = listAssignments_(p);
        break;
      case "updateWork":
        result = updateWork_(p);
        break;
      case "dashboard":
        result = dashboard_();
        break;
      default:
        result = {ok:false, error:"Unknown action"};
    }

    return jsonResponse_(e, result);
  } catch (err) {
    return jsonResponse_(e, {ok:false, error:String(err)});
  }
}

function registerPart_(p) {
  required_(p, ["OrderNo","PartNo","PartName","DrawingNo","DrawingRev","MaterialGrade","Quantity"]);

  const sh = SpreadsheetApp.getActive().getSheetByName(SHEETS.PARTS);
  const id = "PART-" + Utilities.getUuid().slice(0,8).toUpperCase();
  const now = new Date();

  sh.appendRow([
    id, p.OrderNo, p.Customer || "", p.PO_RFQ || "", p.PartNo, p.PartName,
    p.DrawingNo, p.DrawingRev, p.MaterialGrade, Number(p.Quantity),
    p.Application || "", p.BatchHeatNo || "", p.Priority || "Normal",
    p.TargetDate || "", "Registered", now, p.CreatedBy || ""
  ]);

  return {ok:true, message:"Part registered", partId:id};
}

function listParts_() {
  const rows = getRows_(SHEETS.PARTS);
  return {ok:true, parts:rows};
}

function assignWork_(p) {
  required_(p, ["PartID","ProcessSection","Task","Department","StartDate","DueDate"]);

  const part = findBy_(SHEETS.PARTS, "PartID", p.PartID);
  if (!part) throw new Error("PartID not found");

  const sh = SpreadsheetApp.getActive().getSheetByName(SHEETS.ASSIGNMENTS);
  const id = "ASG-" + Utilities.getUuid().slice(0,8).toUpperCase();
  const now = new Date();

  sh.appendRow([
    id, p.PartID, part.OrderNo, part.PartNo, p.ProcessSection, p.Task,
    p.Department, p.AssignedTo || "", p.StartDate, p.DueDate,
    "Pending", 0, "", "", now
  ]);

  return {ok:true, message:"Work assigned", assignmentId:id};
}

function listAssignments_(p) {
  const rows = getRows_(SHEETS.ASSIGNMENTS);
  let data = rows;
  if (p.PartID) data = data.filter(r => String(r.PartID) === String(p.PartID));
  if (p.OrderNo) data = data.filter(r => String(r.OrderNo) === String(p.OrderNo));
  return {ok:true, assignments:data};
}

function updateWork_(p) {
  required_(p, ["AssignmentID","Status","Progress"]);

  const sh = SpreadsheetApp.getActive().getSheetByName(SHEETS.ASSIGNMENTS);
  const row = findRowBy_(SHEETS.ASSIGNMENTS, "AssignmentID", p.AssignmentID);
  if (!row) throw new Error("AssignmentID not found");

  const values = sh.getRange(row,1,1,HEADERS.Assignments.length).getValues()[0];
  const headers = HEADERS.Assignments;
  const obj = {};
  headers.forEach((h,i) => obj[h] = values[i]);

  obj.Status = p.Status;
  obj.Progress = Math.max(0, Math.min(100, Number(p.Progress)));
  obj.Remarks = p.Remarks || "";
  obj.LastUpdate = p.UpdateDate || new Date();

  headers.forEach((h,i) => sh.getRange(row,i+1).setValue(obj[h]));

  const up = SpreadsheetApp.getActive().getSheetByName(SHEETS.UPDATES);
  up.appendRow([
    "UPD-" + Utilities.getUuid().slice(0,8).toUpperCase(),
    obj.AssignmentID, obj.PartID, obj.OrderNo, obj.Department,
    p.UpdateDate || new Date(), p.Status, Number(p.Progress),
    p.Remarks || "", p.EvidenceLink || "", p.UpdatedBy || "", new Date()
  ]);

  return {ok:true, message:"Work updated"};
}

function dashboard_() {
  const parts = getRows_(SHEETS.PARTS);
  const assignments = getRows_(SHEETS.ASSIGNMENTS);
  const updates = getRows_(SHEETS.UPDATES);

  const totalParts = parts.length;
  const totalAssignments = assignments.length;
  const completed = assignments.filter(x => String(x.Status).toLowerCase() === "completed").length;
  const inProgress = assignments.filter(x => String(x.Status).toLowerCase() === "in progress").length;
  const pending = assignments.filter(x => String(x.Status).toLowerCase() === "pending").length;
  const avgProgress = totalAssignments
    ? Math.round(assignments.reduce((s,x)=>s+Number(x.Progress||0),0)/totalAssignments)
    : 0;

  const departments = {};
  assignments.forEach(x => {
    const d = x.Department || "Unassigned";
    if (!departments[d]) departments[d] = {department:d,total:0,completed:0,progress:0};
    departments[d].total++;
    departments[d].progress += Number(x.Progress||0);
    if (String(x.Status).toLowerCase() === "completed") departments[d].completed++;
  });
  Object.values(departments).forEach(d => {
    d.progress = d.total ? Math.round(d.progress/d.total) : 0;
  });

  const partMap = {};
  parts.forEach(p => partMap[p.PartID] = p);
  const partProgress = parts.map(p => {
    const a = assignments.filter(x => x.PartID === p.PartID);
    const progress = a.length ? Math.round(a.reduce((s,x)=>s+Number(x.Progress||0),0)/a.length) : 0;
    return {
      PartID:p.PartID, OrderNo:p.OrderNo, PartNo:p.PartNo, PartName:p.PartName,
      Customer:p.Customer, Status:p.Status, Progress:progress, Tasks:a.length
    };
  });

  return {
    ok:true,
    summary:{totalParts,totalAssignments,completed,inProgress,pending,avgProgress},
    departments:Object.values(departments),
    parts:partProgress,
    recentUpdates:updates.slice(-20).reverse()
  };
}

/* ---------- helpers ---------- */

function setupSheet_(name, headers) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1,1,1,headers.length).setValues([headers]);
  }
  return sh;
}

function getRows_(sheetName) {
  const sh = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sh || sh.getLastRow() < 2) return [];
  const data = sh.getDataRange().getValues();
  const headers = data.shift();
  return data.filter(r => r.some(v => v !== "")).map(row => {
    const o = {};
    headers.forEach((h,i) => {
      const v = row[i];
      o[h] = v instanceof Date ? Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm") : v;
    });
    return o;
  });
}

function findBy_(sheetName, field, value) {
  return getRows_(sheetName).find(r => String(r[field]) === String(value));
}

function findRowBy_(sheetName, field, value) {
  const sh = SpreadsheetApp.getActive().getSheetByName(sheetName);
  const headers = HEADERS[sheetName];
  const col = headers.indexOf(field) + 1;
  if (!col || sh.getLastRow() < 2) return null;
  const vals = sh.getRange(2,col,sh.getLastRow()-1,1).getValues();
  for (let i=0;i<vals.length;i++) {
    if (String(vals[i][0]) === String(value)) return i+2;
  }
  return null;
}

function required_(p, fields) {
  fields.forEach(f => {
    if (p[f] === undefined || String(p[f]).trim() === "") {
      throw new Error("Required field missing: " + f);
    }
  });
}

function jsonResponse_(e, obj) {
  const callback = e && e.parameter && e.parameter.callback;
  const json = JSON.stringify(obj);
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
