const dropArea = document.querySelector(".dropArea");
const dropInput = document.getElementById("dropInput");
const clearBtn = document.getElementById("clear");
const form = document.getElementById("webForm"); 

const scriptURL = "https://script.google.com/macros/s/AKfycbxwY7XzUzUKSCjQW4Kii7uD1e69HXOgdkk11kCpARUH4td3d9-yyaQC8xcA33X0dqM/exec";

let uploadedFileData = null;


const initialDropAreaHTML = `
    <svg class="drop-zone__icon" viewBox="0 0 24 24" width="28" height="28" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
    <p class="drag">Drag your Files Here or <span style="color:blueviolet">Browse</span></p>
    <p class="type">PDF,PNG,JPG upto 5MB</p>`;

const getDropContentElement = () => {
  return dropArea.querySelector('#dropArea_content');
};

const setDropContent = (html) => {
  let content = getDropContentElement();
  if (!content) {
    content = document.createElement('div');
    content.id = 'dropArea_content';
    dropArea.prepend(content);
  }
  content.innerHTML = html;
};


dropArea.addEventListener("click", (e) => {
  if (e.target && e.target.id === "x") {
    e.preventDefault();
    e.stopPropagation();
    dropInput.value = "";
    uploadedFileData = null;
    setDropContent(initialDropAreaHTML);
  } else {
    dropInput.click();
  }
});


dropInput.addEventListener("change", async (e) => {
  const file = dropInput.files[0];
  if (!file) return;

  // Reject files larger than 5 MB
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > MAX_SIZE) {
    alert("File exceeds 5 MB limit. Please choose a smaller file.");
    dropInput.value = "";
    uploadedFileData = null;
    setDropContent(initialDropAreaHTML);
    return;
  }

  setDropContent(`
    <span class="file-name">${file.name}</span>
    <button id="x" type="button">X</button>
  `);

  try {
    const base64String = await convertToBase64(file);
    
    const regex = /^data:(.+);base64,(.*)$/;
    const matches = base64String.match(regex);
    
    if (matches) {
      const mimeType = matches[1];
      const rawData = matches[2];
      
     
      uploadedFileData = {
        filename: file.name,
        mimeType: mimeType,
        fileData: rawData
      };
      console.log("File processed successfully:", uploadedFileData);
    }
  } catch (error) {
    console.error("Error reading file:", error);
  }
});


const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => { 
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = () => resolve(fileReader.result);
    fileReader.onerror = (error) => reject(error);
  });
};


form.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const formValues = new FormData(form);
    const payloadForm = new FormData();
    

    payloadForm.append("firstName", formValues.get("FirstName") || "");
    payloadForm.append("lastName", formValues.get("LastName") || "");
    payloadForm.append("email", formValues.get("Email") || "");


    if (uploadedFileData) {
      payloadForm.append("fileName", uploadedFileData.filename);
      payloadForm.append("mimeType", uploadedFileData.mimeType);
      payloadForm.append("fileData", uploadedFileData.fileData);
    } else {
      payloadForm.append("fileName", "");
      payloadForm.append("mimeType", "");
      payloadForm.append("fileData", "");
    }

    const response = await fetch(scriptURL, {
      method: "POST",
      body: payloadForm
    });



    form.reset();
    dropArea.innerHTML = initialDropAreaHTML;
    dropInput.value = "";
    uploadedFileData = null;
  } catch (err) {
    console.error("Submission failed:", err);
    alert("Submission failed. Check the browser developer console.");
    return 0;
  }
  alert("Form submitted successfully!");
  retrieveSheetData();
});


function clearForm() {
  if (form) form.reset();
  if (dropArea) setDropContent(initialDropAreaHTML);
  if (dropInput) dropInput.value = "";
  uploadedFileData = null;
}




const responseBtn = document.getElementById("response_btn");
responseBtn.addEventListener("click", () => {
  responseBtn.classList.toggle("active");
})



const refreshBtn = document.getElementById("refresh_btn");
refreshBtn.addEventListener("click", () => {
  retrieveSheetData();
});








async function retrieveSheetData() {
  try {
    const response = await fetch(scriptURL);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    
    const dataRows = await response.json();
    
    
    console.log(`Successfully retrieved ${dataRows.length} total rows from the spreadsheet:`, dataRows);
    
    dataRows.forEach((row, index) => {
      console.log(`\n--- Row #${index + 1} Data ---`);
      console.log(`Name: ${row.FirstName} ${row.LastName}`);
      console.log(`Email: ${row.Email}`);
      console.log(`File Uploaded: ${row.FileName || "None"}`);
      console.log(`MIME Type: ${row.MIMEType || "None"}`);
      
      if (row.FileData) {
        console.log(`Raw Base64 string exists (Length: ${row.FileData.length} characters)`);
      }
    });


    const responseBody = document.getElementById("response_body");
    if (responseBody) {
      responseBody.innerHTML = ""; // clear existing rows

      dataRows.forEach((row) => {
        const tr = document.createElement("tr");

        const makeCell = (value) => {
          const td = document.createElement("td");
          td.textContent = value || "";
          return td;
        };

        tr.appendChild(makeCell(row.FirstName));
        tr.appendChild(makeCell(row.LastName));
        tr.appendChild(makeCell(row.Email));
        tr.appendChild(makeCell(row.FileName || ""));
        tr.appendChild(makeCell(row.MIMEType || ""));


        const filePreview = row.FileData
          ? (row.FileData.length > 100 ? row.FileData.substring(0, 100) + "..." : row.FileData)
          : "";
        tr.appendChild(makeCell(filePreview));

        responseBody.appendChild(tr);
      });
    }

    return dataRows;
  } catch (error) {
    console.error("Failed to retrieve all spreadsheet rows:", error);
  }
}

retrieveSheetData();
