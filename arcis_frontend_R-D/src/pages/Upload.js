import React, { useState } from "react";
import axios from "axios";

function UploadForm() {
  const [districtFile, setDistrictFile] = useState(null);
  const [userFile, setUserFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDistrictFileChange = (e) => setDistrictFile(e.target.files[0]);
  const handleUserFileChange = (e) => setUserFile(e.target.files[0]);

  const handleDistrictSubmit = async (e) => {
    e.preventDefault();
    if (!districtFile) {
      setMessage("Please select a district file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", districtFile);

    setIsLoading(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/api/operator/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setMessage(res.data.message);
    } catch (err) {
      console.error("District upload failed:", err);
      setMessage("District upload failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (!userFile) {
      setMessage("Please select a user Excel file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", userFile);

    setIsLoading(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/api/operator/uploadExcel`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setMessage(res.data.message);
    } catch (err) {
      console.error("User upload failed:", err);
      setMessage("User upload failed. Check backend or file format.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
        
      <h2 style={styles.title}>Upload District Excel File</h2>
      <form onSubmit={handleDistrictSubmit} style={styles.form}>
        <input type="file" accept=".xlsx" onChange={handleDistrictFileChange} style={styles.input} />
        <button type="submit" style={styles.button} disabled={isLoading}>
          {isLoading ? "Uploading..." : "Upload District File"}
        </button>
      </form>

      <hr style={styles.hr} />

      <h2 style={styles.title}>Upload User Excel File</h2>
      <form onSubmit={handleUserSubmit} style={styles.form}>
        <input type="file" accept=".xlsx" onChange={handleUserFileChange} style={styles.input} />
        <button type="submit" style={styles.button} disabled={isLoading}>
          {isLoading ? "Uploading..." : "Upload User File"}
        </button>
      </form>

      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
}


const styles = {
  container: {
    padding: "30px",
    margin: "auto",
    backgroundColor: "#f9f9f9",
    borderRadius: "10px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    fontFamily: "'Segoe UI', sans-serif",
  },
  title: {
    fontSize: "20px",
    color: "#333",
    marginBottom: "15px",
  },
  form: {
    marginBottom: "20px",
  },
  input: {
    display: "block",
    marginBottom: "10px",
    fontSize: "16px",
  },
  button: {
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    padding: "10px 20px",
    fontSize: "16px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  hr: {
    margin: "40px 0",
    border: "none",
    borderTop: "1px solid #ddd",
  },
  message: {
    fontSize: "16px",
    color: "#333",
    marginTop: "10px",
  },
};

export default UploadForm;
