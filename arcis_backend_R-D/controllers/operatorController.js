const xlsx = require("xlsx");
const District = require("../models/district");
const fs = require("fs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/userModel")



const uploadDistrictDetails = async (req, res) => {
  try {
    const workbook = xlsx.readFile(req.file.path);
    console.log(workbook);
    
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    console.log(sheet);
    
    const data = xlsx.utils.sheet_to_json(sheet);
    console.log(data);
    

    // Step 1: Convert Excel data to array of district objects
    const district = data.map((row, index) => ({
      Srno: row.Srno || index + 1,
      dist_name: String(row.dist_name || "").trim(),
      accode: String(row.accode || "").trim(),
      accName: String(row.accName || "").trim(),
      districtAssemblyCode: String(row.districtAssemblyCode || "").trim(),
    }));
    console.log(district);
    


    // Step 2: Remove any record with empty required fields
    const nonEmptyDistrict = district.filter(d =>
      d.dist_name && d.accode && d.accName && d.districtAssemblyCode
    );
    console.log(nonEmptyDistrict);
    

    if (nonEmptyDistrict.length === 0) {
      return res.status(400).json({ message: "All records have missing required fields." });
    }
    console.log(nonEmptyDistrict);
    

    // Step 3: Prepare lists for checking existing duplicates in DB
    const accodeList = nonEmptyDistrict.map(d => d.accode);
    console.log(accodeList);
    
    const accNameList = nonEmptyDistrict.map(d => d.accName);
    console.log(accNameList);
    
    const codeList = nonEmptyDistrict.map(d => d.districtAssemblyCode);
    console.log(codeList);
    

    // Step 4: Find any existing records with same keys
    const existing = await District.find({
      $or: [
        { accode: { $in: accodeList } },
        { accName: { $in: accNameList } },
        { districtAssemblyCode: { $in: codeList } }
      ]
    });
    console.log(existing);
    

    // Step 5: Build a Set of existing keys for fast lookup
    const existingKeys = new Set(
      existing.flatMap(doc => [doc.accode, doc.accName, doc.districtAssemblyCode])
    );
    console.log(existingKeys);
    

    // Step 6: Filter out duplicates
    const filteredDistrict = nonEmptyDistrict.filter(
      d =>
        !existingKeys.has(d.accode) &&
        !existingKeys.has(d.accName) &&
        !existingKeys.has(d.districtAssemblyCode)
    );
    console.log(filteredDistrict);
    

    // Step 7: If all are duplicates, exit
    if (filteredDistrict.length === 0) {
      return res.status(409).json({
        message: "All entries are duplicates or invalid. No data inserted."
      });
    }

    // Step 8: Insert the filtered (valid, unique) records
    const response = await District.insertMany(filteredDistrict);
    console.log(response);
    

    // Step 9: Send response
    res.status(200).json({
      message: "File uploaded successfully.",
      inserted: filteredDistrict.length,
      skipped: district.length - filteredDistrict.length
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
};

const uploadPasswordHashExcel = async (req, res) => {
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Step 1: Convert Excel rows to user objects
    const users = await Promise.all(data.map(async (row, index) => {
      const rawPassword = String(row.password || "").trim();
      if (!rawPassword) return null;

      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      // Collect all UserAccessibleRegions[i] columns
      const userRegions = Object.keys(row)
        .filter(key => key.startsWith("UserAccessibleRegions["))
        .map(key => String(row[key]).trim())
        .filter(Boolean); // remove empty strings

      return {
        name: String(row.name || "").trim(),
        email: String(row.email || "").trim(),
        mobile: String(row.mobile || "").trim(),
        password: hashedPassword,
        UserAccessibleRegions: userRegions,
        Isverified: parseInt(row.Isverified) || 0,
        loginAttempts: parseInt(row.loginAttempts) || 0
      };
    }));


    // Step 2: Filter out incomplete or null user rows
    const validUsers = users.filter(user =>
      user && user.email && user.password
    );

    if (validUsers.length === 0) {
      return res.status(400).json({ message: "No valid users to insert." });
    }

    // Step 3: Check for duplicate emails
    const emailList = validUsers.map(u => u.email);
    const existing = await User.find({ email: { $in: emailList } });
    const existingEmails = new Set(existing.map(u => u.email));

    // Step 4: Filter out users with duplicate emails
    const uniqueUsers = validUsers.filter(u => !existingEmails.has(u.email));

    if (uniqueUsers.length === 0) {
      return res.status(409).json({ message: "All entries are duplicates. No data inserted." });
    }

    // Step 5: Insert into MongoDB
    await User.insertMany(uniqueUsers);

    res.status(200).json({
      message: "Users uploaded successfully.",
      inserted: uniqueUsers.length,
      skipped: validUsers.length - uniqueUsers.length
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
};

module.exports = {
  uploadDistrictDetails,
  uploadPasswordHashExcel
};