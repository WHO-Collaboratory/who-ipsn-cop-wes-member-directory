let members = [];

const searchBar = document.getElementById("searchBar");
const suggestions = document.getElementById("suggestions");
const memberList = document.getElementById("memberList");
const sortBy = document.getElementById("sortBy");
const searchBtn = document.getElementById("searchBtn");
const clearSearchBtn = document.getElementById("searchClearIcon");

// ---- Normalize JSON keys ----
function normalizeMember(raw) {

  return { 
    name: raw.name || "", 
    pronouns: raw.pronouns || "", 
    professional_Title: raw.professional_Title || raw["Professional (Title)"] || "", 
    photo: raw.photo || "images/default.jpg", 
    organization: raw.organization || raw["Organization / Affiliation"] || "", 
    sector: raw.sector || "", 
    primary_Role: raw.primary_Role || raw["Primary (Role)"] || "", 
    career_Stage: raw.career_Stage || raw["Career (Stage)"] || "", 
    country_based: raw.country_based || raw["Country (based)"] || "", 
    country_work: raw.country_work || raw["Country (work)"] || "", 
    region: raw.region || raw["Region"] || "", 
    language: raw.language || raw["Language "] || "", 
    health_Threat_Category: raw.health_Threat_Category || raw["Health (Threats) (category)"] || "",
    health_Threat_Pathogen: raw.health_Threat_Pathogen || raw["Health (Threats) (Pathogen/Threat)"] || "", 
    setting: raw.setting || raw["setting of work"] || "", 
    expertise: raw.expertise || "", 
    laboratory_Methods: raw.laboratory_Methods || raw["Laboratory (methods)"] || "", 
    interest_Areas: raw.interest_Areas || raw["Interest (Areas)"] || raw["Interests"] || "", 
    seeking_Collaborations: raw.seeking_Collaborations || raw["Seeking (Collaborations)"] || "", 
    collaboration_Type: raw.collaboration_Type || raw["Collaboration (Type)"] || "", 
    email: raw.email || "", 
    websites: raw.websites || raw["Websites / LinkedIn"] || "",
   };
  }

// ---- Load data from backend ----
const API_URL = "https://cop-wes-member-directory-backend.onrender.com/members";

const statusBox = document.createElement("div");
statusBox.id = "status-message";
statusBox.style.margin = "10px 0";
statusBox.style.fontWeight = "bold";
statusBox.style.textAlign = "center";
document.body.prepend(statusBox);

function showStatus(msg, isError = false, showRetry = false) {
  statusBox.innerHTML = msg;
  statusBox.style.color = isError ? "red" : "green";
  if (showRetry) {
    const retryBtn = document.createElement("button");
    retryBtn.textContent = "Retry";
    retryBtn.style.marginLeft = "10px";
    retryBtn.style.padding = "5px 10px";
    retryBtn.style.cursor = "pointer";
    retryBtn.onclick = loadMembers;
    statusBox.appendChild(retryBtn);
  }
}

async function loadMembers() {
  showStatus("🔄 Loading member data...");

  console.log("Fetching data from:", API_URL);

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Unexpected data format");

    members = data.map(normalizeMember);

    if (!members.length) {
      showStatus("⚠️ No members found in backend data.", true, true);
      console.warn("Empty member data received:", data);
      return;
    }

    members.sort((a, b) =>
      (a.name || "").trim().toLowerCase()
        .localeCompare((b.name || "").trim().toLowerCase(), undefined, { sensitivity: "base", numeric: true })
    );

    console.log("✅ Members loaded successfully:", members);
    showStatus(`✅ Loaded ${members.length} members successfully.`);
    setTimeout(() => { statusBox.style.display = "none"; }, 1000);

    recompute();
  } catch (err) {
    console.error("❌ Error loading members from backend:", err);
    showStatus("⚠️ Unable to load members. Please try again.", true, true);
    setTimeout(() => { statusBox.style.display = "none"; }, 1000);
  }
}

loadMembers();


// ---- Helpers ----
function getCheckedValues(className) {
  const checkboxes = Array.from(document.querySelectorAll(`input.filter.${className}`));
  const checked = checkboxes.filter(cb => cb.checked).map(cb => cb.value);

  if (checked.includes("All")) {
    // When 'All' is checked, uncheck others
    checkboxes.forEach(cb => {
      if (cb.value !== "All") cb.checked = false;
    });
    return [];
  }

  return checked;
}


// ---- Display Members ----
function displayMembers(list) {
  memberList.innerHTML = "";
  document.querySelectorAll(".modal").forEach(m => m.remove());

  if (!list || !list.length) {
    memberList.innerHTML = "<p>No members found.</p>";
    return;
  }

  list.forEach((member, index) => {
    const card = document.createElement("div");
    card.className = "member-card";
    card.innerHTML = `
      <img src="${member.photo}" alt="${member.name}" class="member-photo" />      
      <div class="member-info">
        <h5>${member.name}</h5>
        <p>${member.professional_Title}</p>
        <p><em>${member.organization}</em></p>
        <p>${member.country_based}</p>
      </div>
    `;
    card.onclick = () => openModal(`modal${index}`);
    memberList.appendChild(card);

    const modal = document.createElement("div");
    modal.id = `modal${index}`;
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close" onclick="closeModal('modal${index}')">&times;</span>
        ${Object.entries(member)
          .filter(([key]) => key.toLowerCase() !== "photo") 
          .map(([key, val]) => val
            ? `<p><strong>${key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}:</strong> ${val}</p>`
            : ""
          )
          .join("")}
      </div>
    `;
    document.body.appendChild(modal);
  });
}

// ---- Compute + Sort + Render ----
function recompute() {
  if (!members || !members.length) {
    showStatus("⚠️ No member data available yet.", true);
    return;
  }

  const q = searchBar.value.trim().toLowerCase();
  const regions = getCheckedValues("region").map(r => r.trim().toLowerCase());
  const pathogens = getCheckedValues("pathogen").map(p => p.trim().toLowerCase());
  const settings = getCheckedValues("setting").map(s => s.trim().toLowerCase());
  const key = sortBy.value || "name";

  let list = members.filter(m => {
    const inSearch = !q || Object.values(m).some(val => (val || "").toLowerCase().includes(q));

    const memberRegion = (m.region || "").toLowerCase().trim();

    const memberPathogens = (m.health_Threat_Category || "")
      .toLowerCase()
      .split(/[,;]\s*/)
      .map(p => p.trim());

    const memberSettings = (m.setting || "")
      .toLowerCase()
      .split(/[,;]\s*/)
      .map(s => s.trim());

    const matchRegion =
      !regions.length || regions.some(r => memberRegion.includes(r));

    const matchPathogen =
      !pathogens.length ||
      pathogens.some(p =>
        memberPathogens.some(mp => {
          return (
            mp.includes(p) ||
            (p.includes("parastic") && mp.includes("parasitic")) ||
            (p.includes("parasitic") && mp.includes("parastic"))
          );
        })
      );

    const matchSetting =
      !settings.length ||
      settings.some(s =>
        memberSettings.some(ms => ms.includes(s))
      );

    return inSearch && matchRegion && matchPathogen && matchSetting;
  });

  list.sort((a, b) =>
    (a[key] || "").trim().toLowerCase()
      .localeCompare((b[key] || "").trim().toLowerCase(), undefined, {
        sensitivity: "base",
        numeric: true
      })
  );

  displayMembers(list);
  updateSuggestions(q, list);
}


function openModal(id) {
  document.getElementById(id).style.display = 'flex';
}
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}
window.onclick = function (event) {
  document.querySelectorAll('.modal').forEach(modal => {
    if (event.target === modal) modal.style.display = 'none';
  });
};


document.querySelectorAll(".filter").forEach(cb => cb.addEventListener("change", recompute));
sortBy.addEventListener("change", recompute);
searchBtn.addEventListener("click", e => { e.preventDefault(); recompute(); });
clearSearchBtn.addEventListener("click", e => { e.preventDefault(); searchBar.value = ""; recompute(); });
searchBar.addEventListener("keypress", e => { if (e.key === "Enter") { e.preventDefault(); recompute(); } });


function checkPassword() {
  const password = document.getElementById("password").value;
  const error = document.getElementById("error");
  const welcomeMsg = document.getElementById("welcome-message");
  const correctPassword = "copwes1";

  if (password === correctPassword) {
    if (welcomeMsg) welcomeMsg.style.display = "none";
    error.style.color = "green";
    error.textContent = "Login successful!";
    setTimeout(() => window.location.href = "home.html", 1000);
  } else {
    error.style.color = "red";
    error.textContent = "❌ Incorrect password. Try again.";
  }
}

const homeBtn = document.getElementById("homeBtn");
if (homeBtn) homeBtn.addEventListener("click", () => window.location.href = "home.html");


// Reset All filter 
function resetFilters() {

  document.querySelectorAll(".filter").forEach(cb => {
    cb.checked = false;
  });

  const searchInput = document.getElementById("global-search");
  if (searchInput) searchInput.value = "";

  const sortSelect = document.getElementById("sort");
  if (sortSelect) sortSelect.value = "";
  
  displayMembers(members);

  const statusBox = document.getElementById("statusBox");
  if (statusBox) {
    statusBox.style.display = "block";
    statusBox.textContent = "✅ Filters reset — showing all members.";
    setTimeout(() => {
      statusBox.style.display = "none";
    }, 2000);
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

document.querySelectorAll(".filter").forEach(cb => {
  cb.addEventListener("change", recompute);
});

//http://localhost:5500
