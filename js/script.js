// Reset dat
document.getElementById("resetData").addEventListener("click", () => {
     if (confirm("Opravdu chceš vymazat všechna uložená data?")) {
          localStorage.removeItem("liniovyStrom");
          location.reload();
     }
});

// Výchozí data
let data = JSON.parse(localStorage.getItem("liniovyStrom")) || {
     name: "",
     pin: "0",
     body: 0,
     pozice: 0,
     pocetClenu: 0,
     email: "",
     clenove: [

     ]
};

function saveData() {
     localStorage.setItem("liniovyStrom", JSON.stringify(data));
}

// Vykreslení stromu
function createContainer(person) {
     const li = document.createElement("li");

     const hasChildren = person.clenove && person.clenove.length > 0;
     const toggle = document.createElement("span");
     const label = document.createElement("label");
     label.innerHTML = `
     <div class="label-header">
     <h3>${person.name}</h3>
         <div class="icon-buttons">
             <button class="toggle-btn">+</button>      
         </div>
     </div>
     <p>Pin: ${person.pin || "-"}</p>
    <p>Body: ${person.body || 0}</p>
    <p>Pozice: ${person.pozice || "-"}</p>
    <p>Počet členů: ${person.pocetClenu || "-"}</p>
    <p>Email: ${person.email || "-"}</p>
     `;

     li.appendChild(label);

     if (hasChildren) {
          const ul = document.createElement("ul");
          person.clenove.forEach(child => ul.appendChild(createContainer(child)));
          li.appendChild(ul);

          // Kliknutím na +/- sbalí nebo rozbalí
          const toggleBtn = label.querySelector(".toggle-btn");
          if (toggleBtn) {
               toggleBtn.addEventListener("click", e => {
                    e.stopPropagation();
                    const sublist = li.querySelector("ul");
                    if (sublist) {
                         sublist.classList.toggle("hidden");
                         toggleBtn.textContent = sublist.classList.contains("hidden") ? "+" : "-";
                    }
               });
          };
     }

     // Klik na jméno = otevření formuláře
     label.addEventListener("click", () => openEditForm(person));
     return li;
}

function renderContainer() {
     const container = document.getElementById("container");
     container.innerHTML = "";
     const ul = document.createElement("ul");
     ul.appendChild(createContainer(data));
     container.appendChild(ul);
}

// Přidání člena
document.getElementById("addForm").addEventListener("submit", e => {
     e.preventDefault();
     const name = document.getElementById("name").value.trim();
     const parentName = document.getElementById("parent").value.trim();
     const pin = document.getElementById("pin").value.trim() || "-";
     const body = parseFloat(document.getElementById("body").value) || "-";
     const pozice = document.getElementById("pozice").value.trim() || "-";
     const pocetClenu = document.getElementById("pocetClenu").value.trim() || "-";
     const email = document.getElementById("email").value.trim() || "-";

     function findAndAddMember(person) {
          if (person.name.toLowerCase() === parentName.toLowerCase()) {
               person.clenove.push({ name, body, pozice, pocetClenu, email, clenove: [] });
               return true;
          }
          for (let child of person.clenove) {
               if (findAndAddMember(child)) return true
          }
          return false;
     }

     if (findAndAddMember(data)) {
          saveData();
          renderContainer();
          e.target.reset();
     } else {
          alert("Nadřízený nebyl nalezen");
     }
});

// Editace člena
const editFormContainer = document.getElementById("editFormContainer");
const editForm = document.getElementById("editForm");
let currentPerson = null;

function openEditForm(person) {
     currentPerson = person;
     document.getElementById("editName").value = person.name || "";
     document.getElementById("editPin").value = person.pin || "";
     document.getElementById("editBody").value = person.body || "";
     document.getElementById("editPozice").value = person.pozice || "";
     document.getElementById("editPocetClenu").value = person.pocetClenu || "";
     document.getElementById("editEmail").value = person.email || "";
     editFormContainer.style.display = "block";
}

document.getElementById("cancelEdit").addEventListener("click", () => {
     editFormContainer.style.display = "none";
     currentPerson = null;
});

editForm.addEventListener("submit", e => {
     e.preventDefault();
     if (!currentPerson) return;
     currentPerson.name = document.getElementById("editName").value.trim();
     currentPerson.pin = document.getElementById("editPin").value.trim();
     currentPerson.body = parseFloat(document.getElementById("editBody").value) || 0;
     currentPerson.pozice = document.getElementById("editPozice").value.trim();
     currentPerson.pocetClenu = document.getElementById("editPocetClenu").value.trim();
     currentPerson.email = document.getElementById("editEmail").value.trim();
     saveData();
     renderContainer();
     editFormContainer.style.display = "none";
});

document.getElementById("deleteMember").addEventListener("click", () => {
     if (!currentPerson) return;
     if (!confirm(`Opravdu chceš smazat člena "${currentPerson.name}"?`)) return;
     function removePerson(parent, target) {
          if (!parent.clenove) return false;
          const i = parent.clenove.indexOf(target);
          if (i !== -1) {
               parent.clenove.splice(i, 1);
               return true;
          }
          for (let child of parent.clenove) {
               if (removePerson(child, target))
                    return true;
          }
          return false;
     }
     removePerson(data, currentPerson);
     currentPerson = null;
     saveData();
     renderContainer();
});
// Export 
document.getElementById("exportData").addEventListener("click", () => {
     const json = JSON.stringify(data, null, 2);
     const blob = new Blob([json], { type: "application/json" });
     const url = URL.createObjectURL(blob);

     const a = document.createElement("a");
     a.href = url;
     a.download = "liniovy_strom.json";
     a.click();

     URL.revokeObjectURL(url);
});

// IMPORT - bezpečnostní kontrola 
document.getElementById("importData").addEventListener("click", () => {
     document.getElementById("importFile").click();
});

document.getElementById("importFile").addEventListener("change", function () {
     const file = this.files[0];
     if (!file) return;

     if (!confirm("Import přepíše celý aktuální strom. Pokračovat?")) return;

     const reader = new FileReader();
     reader.onload = function (e) {
          try {
               const imported = JSON.parse(e.target.result);

               if (!imported || typeof imported !== "object" || !imported.clenove) {
                    alert("Soubor nemá správnou strukturu");
                    return;
               }


               data = imported;
               saveData();
               renderContainer();
               alert("Strom úspěšně naimportován.");
          } catch (error) {
               alert("Chyba při načítání JSON.");
          }
     };
     reader.readAsText(file)
});

// Tmavý/světlý mód
document.getElementById("toggleTheme").addEventListener("click", () => {
     document.body.classList.toggle("dark");
     localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});

// Obnovit téma po načtení
if (localStorage.getItem("theme") === "dark") {
     document.body.classList.add("dark");
}

/* Nový strom */
document.getElementById("newTree").addEventListener("click", () => {
     if (!confirm("Opravdu vytvořit nový strom?")) return;

     data = {
          name: "Kořenový člen",
          pin: "-",
          body: 0,
          pozice: "-",
          email: "-",
          pocetClenu: "-",
          clenove: []
     };
     saveData();
     renderContainer();
}); renderContainer();


//   vyhledávání s auto-rozbalením a zvýrazněním   
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const clearSearchBtn = document.getElementById("clearSearch");

function clearHighlights() {
     document.querySelectorAll(".highlight").forEach(el => {
          el.classList.remove("highlight");
     });
}

// najde všechny labely, které obsahují hledaný text (case-insentisive)
function searchTreeByName(query) {
     clearHighlights();
     if (!query) return [];

     query = query.trim().toLowerCase();
     const labels = Array.from(document.querySelectorAll(".container label"));
     const matches = [];

     labels.forEach(label => {
          const nameEl = label.querySelector("h3");
          if (!nameEl) return;
          const text = nameEl.textContent.trim().toLowerCase();
          if (text.includes(query)) {
               matches.push(label);
          }
     });
     return matches;
}

// // rozbalí cestu k labelu (od labelu nahoru) a zvýrazní ho
function expandPathToLabel(labelEl) {
     // highlight
     labelEl.classList.add("highlight");

     // najdi nejbližší li
     const li = labelEl.closest("li");
     if (!li) return;

     // rozbalit všechny nadřazené <ul>
     let current = li;
     while (current) {
          const parentUl = current.parentElement; // může být UL nebo null
          if (parentUl && parentUl.tagName === "UL") {
               // pokud je tento ul skryt (má třídu hidden), odstraň jí
               if (parentUl.classList.contains("hidden")) parentUl.classList.remove("hidden");
               // nastav text tlačítka u rodiče (pokud existuje)
               const parentLi = parentUl.closest("li");
               if (parentLi) {
                    const parentLabel = parentLi.querySelector("label");
                    if (parentLabel) {
                         const btn = parentLabel.querySelector(".toggle-btn");
                         if (btn) {
                              btn.textContent = parentUl.classList.contains("hidden") ? "+" : "-";
                         }
                    }
               }
               current = parentUl.closest("li"); // jdi výš
          } else break;
     }

     // posuň do zorného pole (jemně)
     labelEl.scrollIntoView({ behavior: "smooth", block: "center" });
}

// hlavní funkce - vykoná vyhledání, rozbalení a zvýraznění
function performSearch(query) {
     clearHighlights();
     if (!query || query.trim() === "") {
          return;
     }
     const matches = searchTreeByName(query);
     if (matches.length === 0) {
          alert("Nic nenalezeno.");
          return;
     }

     // rozbal a highlight (u prvního výsledku scroll)
     matches.forEach((labelEl, idx) => {
          expandPathToLabel(labelEl);
     });

     // pokud je více výsledků, můžeš je procházet — tady scroll k prvnímu
     matches[0].scrollIntoView({ behavior: "smooth", block: "center" });
}

// eventy
searchBtn.addEventListener("click", () => performSearch(searchInput.value));
searchInput.addEventListener("keydown", e => {
     if (e.key === "Enter") {
          e.preventDefault();
          performSearch(searchInput.value);
     }
});
clearSearchBtn.addEventListener("click", () => {
     searchInput.value = "";
     clearHighlights();
});


