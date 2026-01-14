const API_URL = "https://docs.google.com/spreadsheets/d/1QgB6wB2QSdxXuj1JbmjfM8qqN7hgQ-rKnpdVqdWc_28/edit?pli=1&gid=0#gid=0";

export async function saveRepair(repair: any) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(repair)
    });

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error saving repair:", error);
  }
}

export async function getRepairs() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching repairs:", error);
    return [];
  }
}
