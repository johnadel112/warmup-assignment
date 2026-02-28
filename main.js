const fs = require("fs");

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {
    startTime = startTime.toLowerCase(); 
    endTime = endTime.toLowerCase();
    //splitting each time into time and period (am/pm)
    let [sTime, sPeriod] = startTime.split(" "); 
    let [eTime, ePeriod] = endTime.split(" ");
    let [sh, sm, ss] = sTime.split(":").map(Number); 
    let [eh, em, es] = eTime.split(":").map(Number);
    if (sPeriod === "pm" && sh !== 12) sh += 12; 
    if (sPeriod === "am" && sh === 12) sh = 0;
    if (ePeriod === "pm" && eh !== 12) eh += 12; 
    if (ePeriod === "am" && eh === 12) eh = 0;
    let difference = (eh * 3600 + em * 60 + es) - (sh * 3600 + sm * 60 + ss);
    let hours = Math.floor(difference / 3600);
    let minutes = Math.floor((difference % 3600) / 60);
    let seconds = difference % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
    startTime = startTime.toLowerCase();
    endTime = endTime.toLowerCase();

    let [sTime, sPeriod] = startTime.split(" ");
    let [eTime, ePeriod] = endTime.split(" ");

    let [sh, sm, ss] = sTime.split(":").map(Number);
    let [eh, em, es] = eTime.split(":").map(Number);
// convert to 24 hour military timing 
    if (sPeriod === "pm" && sh !== 12) sh += 12;
    if (sPeriod === "am" && sh === 12) sh = 0;

    if (ePeriod === "pm" && eh !== 12) eh += 12;
    if (ePeriod === "am" && eh === 12) eh = 0;
// converting to seconds for easier calculations
    let startSec = sh * 3600 + sm * 60 + ss;
    let endSec = eh * 3600 + em * 60 + es;
// delivery boundaries between 8 am and 10 pm in seconds
    let deliveryStart = 8 * 3600;       
    let deliveryEnd = 22 * 3600;       

    let idle = 0;
// calculating if the start time is before the delivery start time (8 am) 
    if (startSec < deliveryStart) {
        // choose the least between the end of the shift and the deliver start - the shift start to calculate idle time
        idle += Math.max(0, Math.min(endSec, deliveryStart) - startSec);
    }

    if (endSec > deliveryEnd) {
        idle += Math.max(0, endSec - Math.max(startSec, deliveryEnd));
    }

    let h = Math.floor(idle / 3600);
    let m = Math.floor((idle % 3600) / 60);
    let s = idle % 60;

    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}


// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {
  
    let [sh, sm, ss] = shiftDuration.split(":").map(Number);
    let [ih, im, is] = idleTime.split(":").map(Number);
// converting to seconds 
    let shiftSec = sh * 3600 + sm * 60 + ss;
    let idleSec = ih * 3600 + im * 60 + is;
// get the active working time 
    let active = shiftSec - idleSec;

    let h = Math.floor(active / 3600);
    let m = Math.floor((active % 3600) / 60);
    let s = active % 60;

    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}


// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
    let [h, m, s] = activeTime.split(":").map(Number);
    
    let activeSec = h * 3600 + m * 60 + s;

    let d = new Date(date);
    // Eid El Fitr between april 10 and april 30 2025
    let eidStart = new Date("2025-04-10");
    
    let eidEnd = new Date("2025-04-30");
// quoata in second
    let quotaSec;
// if eid , quoata is 6 hours else it is 8 hours and 24 minutes 
    if (d >= eidStart && d <= eidEnd) {
        quotaSec = 6 * 3600;
    } else {
        quotaSec = (8 * 3600) + (24 * 60);
    }

    return activeSec >= quotaSec;
}



// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
   let txt="";
 try{
txt = fs.readFileSync(textFile,"utf-8");
 }catch(e){
 txt="";
 }

 txt = txt.trim();
 // splitting the text file into array of lines 
 let arr = txt? txt.split("\n") : [];

 for(let i=0;i<arr.length;i++){
     // splits rows by comma then checks if driverID is in the file and if the data is in the file -> return empty object
    let p=arr[i].split(",");
     if(p[0]===shiftObj.driverID  &&  p[2]===shiftObj.date){
  return {};
     }
 }
// use our created functions 
 console.log("Before calculations");

let dur=getShiftDuration(shiftObj.startTime,shiftObj.endTime);
console.log("Duration OK");

let idle=getIdleTime(shiftObj.startTime,shiftObj.endTime);
console.log("Idle OK");

let active=getActiveTime(dur,idle);
console.log("Active OK");

let met=metQuota(shiftObj.date,active);
console.log("Met OK");

 let line =
 shiftObj.driverID + "," +
 shiftObj.driverName + "," +
 shiftObj.date + "," +
 shiftObj.startTime + "," +
 shiftObj.endTime + "," +
 dur + "," +
 idle + "," +
 active + "," +
 met + "," +
 false;
// inserting the new record at the end of the array if driverID not found 
 let idx=arr.length;

 for(let i=arr.length-1;i>=0;i--){
  if(arr[i].split(",")[0]===shiftObj.driverID){
   idx=i+1;
   break;
  }
 }
// inserting the new row at position idx, removing 0 elements and adding the new line 
 arr.splice(idx,0,line);
// write back to csv file
 fs.writeFileSync(textFile,arr.join("\n"));

 return ({
    driverID: shiftObj.driverID,
    driverName: shiftObj.driverName,
    date: shiftObj.date,
    startTime: shiftObj.startTime,
    endTime: shiftObj.endTime,
    shiftDuration: dur,
    idleTime: idle,
    activeTime: active,
    metQuota: met,
    hasBonus: false
  });
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
      // read the file and split into lines
    let lines = fs.readFileSync(textFile, "utf-8").trim().split("\n");
       for (let i = 0; i < lines.length; i++) {
        // split each line by a comma 
        let parts = lines[i].split(",");
// check if this is the driver we want 
        if (parts[0] === driverID && parts[2] === date) {
           // change the value of the column hasbonus to new value then write back to the csv file 
              parts[9] = String(newValue);
            lines[i] = parts.join(",");
             break;
        }
    }

    fs.writeFileSync(textFile, lines.join("\n"));
}


// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {

    let txt = "";
    try {
        txt = fs.readFileSync(textFile, "utf-8");
    } catch (e) {
        return -1;
    }

    txt = txt.trim();
    let lines = txt ? txt.split("\n") : [];

    let targetMonth = Number(month);   // handles "04" and "4"

    let found = false;
    let count = 0;

    for (let i = 0; i < lines.length; i++) {

        let parts = lines[i].trim().split(",");

        if (parts[0] === driverID) {
            found = true;

            let recordMonth = Number(parts[2].split("-")[1]); // "04" -> 4
            let bonusVal = (parts[9] || "").trim().toLowerCase(); // fixes "true\r"

            if (recordMonth === targetMonth && bonusVal === "true") {
                count++;
            }
        }
    }

    return found ? count : -1;
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
      let txt = "";

    try {
        txt = fs.readFileSync(textFile, "utf-8");
    } catch (e) {
        return "0:00:00";
    }

    txt = txt.trim();
    let rows = txt ? txt.split("\n") : [];

    let total = 0;

    for (let i = 0; i < rows.length; i++) {

        let parts = rows[i].split(",");

        // check driver
        if (parts[0] === driverID) {

            let recordMonth = Number(parts[2].split("-")[1]);

            // check month
            if (recordMonth === Number(month)) {

                let time = parts[7];   // activeTime column
                let [h, m, s] = time.split(":").map(Number);

                total += h * 3600 + m * 60 + s;
            }
        }
    }

    let hh = Math.floor(total / 3600);
    let mm = Math.floor((total % 3600) / 60);
    let ss = total % 60;

    return hh + ":" + String(mm).padStart(2,"0") + ":" + String(ss).padStart(2,"0");
}


// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {

    let shiftsTxt = "";
    try {
        shiftsTxt = fs.readFileSync(textFile, "utf-8");
    } catch (e) {
        return "0:00:00";
    }

    let ratesTxt = "";
    try {
        ratesTxt = fs.readFileSync(rateFile, "utf-8");
    } catch (e) {
        return "0:00:00";
    }

    shiftsTxt = shiftsTxt.trim();
    ratesTxt = ratesTxt.trim();

    let shiftLines = shiftsTxt ? shiftsTxt.split("\n") : [];
    let rateLines = ratesTxt ? ratesTxt.split("\n") : [];

    // get dayOff from rate file
    let dayOff = "";
    for (let i = 0; i < rateLines.length; i++) {
        let p = rateLines[i].trim().split(",");
        if (p[0] === driverID) {
            dayOff = (p[1] || "").trim(); // important (handles \r)
            break;
        }
    }

    let targetMonth = Number(month);
    let totalSec = 0;

    let eidStart = new Date("2025-04-10");
    let eidEnd = new Date("2025-04-30");

    for (let i = 0; i < shiftLines.length; i++) {

        let parts = shiftLines[i].trim().split(",");

        if (parts[0] !== driverID) continue;

        let dateStr = parts[2].trim();
        let recordMonth = Number(dateStr.split("-")[1]);
        if (recordMonth !== targetMonth) continue;

        // skip day off
        let weekday = new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" });
        if (dayOff && weekday === dayOff) continue;

        // add required quota for that date
        let d = new Date(dateStr);
        if (d >= eidStart && d <= eidEnd) {
            totalSec += 6 * 3600;                 // 6:00:00
        } else {
            totalSec += (8 * 3600) + (24 * 60);   // 8:24:00
        }
    }

    // subtract 2 hours per bonus
    totalSec -= Number(bonusCount) * 2 * 3600;
    if (totalSec < 0) totalSec = 0;

    let hh = Math.floor(totalSec / 3600);
    let mm = Math.floor((totalSec % 3600) / 60);
    let ss = totalSec % 60;

    return hh + ":" + String(mm).padStart(2, "0") + ":" + String(ss).padStart(2, "0");
}
// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    let txt = "";
    try {
        txt = fs.readFileSync(rateFile, "utf-8");
    } catch (e) {
        return 0;
    }

    txt = txt.trim();
    let rows = txt ? txt.split("\n") : [];

  
    let basePay = 0;
    let tier = 0;
// search for the driver using driver id 
    for (let i = 0; i < rows.length; i++) {
        let parts = rows[i].split(",");
        if (parts[0] === driverID) {
            basePay = Number(parts[2]);
            tier = Number(parts[3]);
            break;
        }
    }

    // allowed missing hours based on tier
    let allowed = 0;
    if (tier === 1) allowed = 50;
    else if (tier === 2) allowed = 20;
    else if (tier === 3) allowed = 10;
    else if (tier === 4) allowed = 3;

    // convert actual hours to seconds
    let [ah, am, as] = actualHours.trim().split(":").map(Number);
    let actualSec = ah * 3600 + am * 60 + as;

    // convert required hours to seconds
    let [rh, rm, rs] = requiredHours.trim().split(":").map(Number);
    let requiredSec = rh * 3600 + rm * 60 + rs;

    // if driver met required hours, no deduction
    if (actualSec >= requiredSec) return basePay;

    // calculate missing time
    let missingSec = requiredSec - actualSec;

    // only hours count not seconds or minutes so we take the floor of missing seconds and divide it by 3600 
    let missingFullHours = Math.floor(missingSec / 3600);

    // subtract the allowed free missing hours
    let billableHours = missingFullHours - allowed;
    if (billableHours < 0) billableHours = 0;

    // deduction rate is floor(basePay / 185)
    let ratePerHour = Math.floor(basePay / 185);

    // total deduction and net pay
    let deduction = billableHours * ratePerHour;
    let netPay = basePay - deduction;

    return netPay;
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
