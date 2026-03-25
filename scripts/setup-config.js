const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";
const PROJECT_ID = "69c3a3f10011a71ec4dd";
const DB_ID = "habitwallet_main"; // assuming this is the DB ID, I will check the env if it fails
const API_KEY = "standard_21208d0492a7e0c1810aab129cde25e803d5f30019e61e12f027084ffa44168ef628e30cb51388deb7d0072cb5aac9182efbf30cca3c887c7c51b62c9dcd8c5226d06e27a3091e74e893026f3d38373f0c572e4c6b6c5182b6c6b9ee4951ea9af371da1f503981daae25bdf8767935833ba2f5cf131cba7b5491fbf16d9fa294";

const HEADERS = {
  "Content-Type": "application/json",
  "X-Appwrite-Project": PROJECT_ID,
  "X-Appwrite-Key": API_KEY,
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function setup() {
  console.log("Setting up platform_config collection...");

  // 1. Create collection
  const colRes = await fetch(`${APPWRITE_ENDPOINT}/databases/${DB_ID}/collections`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      collectionId: "platform_config",
      name: "Platform Config",
      permissions: ["read(\"any\")", "update(\"users\")"],
      documentSecurity: false
    })
  });
  
  if (!colRes.ok) {
    const error = await colRes.text();
    if (!error.includes("already exists")) {
      console.error("Failed to create collection:", error);
      return;
    }
    console.log("Collection already exists, proceeding...");
  } else {
    console.log("Collection created.");
  }

  // 2. Create 'data' attribute (JSON string)
  const attrRes = await fetch(`${APPWRITE_ENDPOINT}/databases/${DB_ID}/collections/platform_config/attributes/string`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      key: "data",
      size: 10000,
      required: true
    })
  });

  if (!attrRes.ok) {
    const error = await attrRes.text();
    if (!error.includes("already exists")) {
      console.error("Failed to create attribute:", error);
      return;
    }
  } else {
    console.log("Attribute 'data' created.");
  }

  // Poll until attribute is available
  console.log("Waiting for attribute to be available...");
  await sleep(2000);
  
  // 3. Create the initial global document
  const defaultData = JSON.stringify({
    bkashNumber: "01XXXXXXXXX",
    proPrice: "199",
    annualPrice: "1799",
    supportEmail: "support@habitwallet.app"
  });

  const docRes = await fetch(`${APPWRITE_ENDPOINT}/databases/${DB_ID}/collections/platform_config/documents`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      documentId: "global",
      data: {
        data: defaultData
      },
      permissions: ["read(\"any\")", "update(\"users\")"]
    })
  });

  if (!docRes.ok) {
    const error = await docRes.text();
    if (!error.includes("already exists")) {
      console.error("Failed to create document:", error);
      return;
    }
    console.log("Global config document already exists.");
  } else {
    console.log("Initial config document created.");
  }

  console.log("Appwrite configuration setup complete!");
}

setup().catch(console.error);
