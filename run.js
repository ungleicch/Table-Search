(function () {
    "use strict";
  
    /*** CONFIGURATION & DEFAULTS ***/
    // Default list of target countries (in "given" order)
    const defaultCountries = [

    ];
  
    // Query selector for indicator text (data description)
    const indicatorSelector =
      "#main > div.added_data > div > div > div.indicator__content--pI1Ue > div > div.indicatorHeader__indicatorHeader--2QneH > h1 > span";
  
    /*** HELPER FUNCTIONS ***/
    // Escape regex special characters.
    function escapeRegExp(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  
    // Copy given text to clipboard and give temporary visual feedback.
    function copyTextToClipboard(text, cell) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
          .then(() => {
            cell.style.backgroundColor = "#d4edda"; // light green
            setTimeout(() => {
              cell.style.backgroundColor = "";
            }, 1500);
          })
          .catch(err => {
            console.error("Clipboard error:", err);
          });
      } else {
        // Fallback using a temporary textarea.
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed"; // avoid scrolling
        textArea.style.top = "0";
        textArea.style.left = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand("copy");
          cell.style.backgroundColor = "#d4edda";
          setTimeout(() => {
            cell.style.backgroundColor = "";
          }, 1500);
        } catch (err) {
          console.error("Fallback copy error:", err);
        }
        document.body.removeChild(textArea);
      }
    }
  
    // Sort results based on selected order.
    // sortOrder: "website" (order encountered), "given" (order in defaultCountries), or "alphabetical"
    function sortResults(data, sortOrder) {
      let sorted = data.slice(); // clone array
      if (sortOrder === "given") {
        sorted.sort((a, b) => {
          return defaultCountries.indexOf(a.country) - defaultCountries.indexOf(b.country);
        });
      } else if (sortOrder === "alphabetical") {
        sorted.sort((a, b) => a.country.localeCompare(b.country));
      } else {
        // "website" order: sort by the order they were encountered.
        sorted.sort((a, b) => a.websiteOrder - b.websiteOrder);
      }
      return sorted;
    }
  
    /*** DATA COLLECTION FUNCTION ***/
    // Given an array of target countries, search through table rows.
    // Assumes each row has at least two cells: first for country, second for value.
    function performSearch(targetCountries) {
      let resultsByKey = {};
      let websiteIndex = 0;
      // Select rows from <tbody> if available; otherwise, all table rows.
      let tableRows = document.querySelectorAll("table tbody tr");
      if (!tableRows.length) {
        tableRows = document.querySelectorAll("table tr");
      }
  
      tableRows.forEach(row => {
        if (row.cells.length < 2) return;
        const countryCellText = row.cells[0].textContent.trim();
        const valueCellText = row.cells[1].textContent.trim();
  
        // Check if the first cell exactly matches one of the target countries.
        targetCountries.forEach(country => {
          const regex = new RegExp("^" + escapeRegExp(country) + "$", "i");
          if (regex.test(countryCellText)) {
            const key = country + ":" + valueCellText;
            if (!resultsByKey[key]) {
              resultsByKey[key] = {
                country: countryCellText,
                value: valueCellText,
                websiteOrder: websiteIndex++
              };
            }
          }
        });
        // Optional: Highlight the first cell if it exactly matches one of the target countries.
        const combinedRegex = new RegExp("^(" + targetCountries.map(escapeRegExp).join("|") + ")$", "i");
        if (combinedRegex.test(countryCellText)) {
          row.cells[0].style.backgroundColor = "yellow";
        }
      });
  
      return Object.values(resultsByKey);
    }
  
    /*** UI FUNCTIONS ***/
    // Build the results table given a results array and sort order.
    function buildResultsTable(resultsArray, sortOrder) {
      // Clear previous table (if any)
      tableContainer.innerHTML = "";
      const sortedResults = sortResults(resultsArray, sortOrder);
  
      const table = document.createElement("table");
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";
      table.style.marginTop = "10px";
  
      // Header row.
      const headerRow = document.createElement("tr");
      ["Country", "Value (click to copy)"].forEach(headerText => {
        const th = document.createElement("th");
        th.textContent = headerText;
        th.style.border = "1px solid #ddd";
        th.style.padding = "8px";
        th.style.backgroundColor = "#f2f2f2";
        headerRow.appendChild(th);
      });
      table.appendChild(headerRow);
  
      // Data rows.
      sortedResults.forEach(item => {
        const tr = document.createElement("tr");
  
        const tdCountry = document.createElement("td");
        tdCountry.textContent = item.country;
        tdCountry.style.border = "1px solid #ddd";
        tdCountry.style.padding = "8px";
  
        const tdValue = document.createElement("td");
        tdValue.textContent = item.value;
        tdValue.style.border = "1px solid #ddd";
        tdValue.style.padding = "8px";
        tdValue.style.cursor = "pointer";
        tdValue.title = "Click to copy this value";
        tdValue.addEventListener("click", () => {
          copyTextToClipboard(item.value, tdValue);
        });
  
        tr.appendChild(tdCountry);
        tr.appendChild(tdValue);
        table.appendChild(tr);
      });
  
      tableContainer.appendChild(table);
    }
  
    // Update the results based on the current input and selected sort order.
    function updateResults() {
      // Get countries from the search input.
      const inputText = searchInput.value.trim();
      let targetList;
      if (inputText === "") {
        targetList = defaultCountries;
      } else {
        // Split by comma and trim.
        targetList = inputText.split(",").map(s => s.trim()).filter(s => s.length > 0);
      }
      // Perform the search.
      const searchResults = performSearch(targetList);
      // Build the results table.
      buildResultsTable(searchResults, sortSelect.value);
    }
  
    /*** BUILD THE USER INTERFACE ***/
    // Create a container for the search UI and results.
    const containerDiv = document.createElement("div");
    containerDiv.style.backgroundColor = "#fff";
    containerDiv.style.padding = "10px";
    containerDiv.style.margin = "10px";
    containerDiv.style.border = "2px solid #ccc";
    containerDiv.style.maxWidth = "800px";
    containerDiv.style.fontFamily = "Arial, sans-serif";
  
    // Instruction header.
    const instruction = document.createElement("p");
    instruction.textContent =
      "Enter target countries (separated by commas). For example: Angola, Chile, Germany, Latvia, Mexico, Niger, Oman, Tanzania, United States";
    containerDiv.appendChild(instruction);
  
    // Search input field.
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.style.width = "100%";
    searchInput.style.padding = "8px";
    searchInput.style.marginBottom = "10px";
    searchInput.value = defaultCountries.join(", ");
    containerDiv.appendChild(searchInput);
  
    // Search button.
    const searchButton = document.createElement("button");
    searchButton.textContent = "Search";
    searchButton.style.padding = "8px 12px";
    searchButton.style.marginRight = "10px";
    searchButton.addEventListener("click", updateResults);
    containerDiv.appendChild(searchButton);
  
    // Dropdown for sort order.
    const sortLabel = document.createElement("label");
    sortLabel.textContent = "Sort Order: ";
    sortLabel.style.marginRight = "5px";
    containerDiv.appendChild(sortLabel);
  
    const sortSelect = document.createElement("select");
    const sortOptions = [
      { value: "website", text: "Website Order" },
      { value: "given", text: "Given Order" },
      { value: "alphabetical", text: "Alphabetical Order" }
    ];
    sortOptions.forEach(opt => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.text;
      sortSelect.appendChild(option);
    });
    sortSelect.style.marginBottom = "10px";
    // Rebuild the results when sort order changes.
    sortSelect.addEventListener("change", updateResults);
    containerDiv.appendChild(sortSelect);
  
    // Container for the results table.
    const tableContainer = document.createElement("div");
    containerDiv.appendChild(tableContainer);
  
    // If available, get the indicator text from the page and display it.
    const indicatorElement = document.querySelector(indicatorSelector);
    if (indicatorElement) {
      const indicatorHeader = document.createElement("h3");
      indicatorHeader.textContent = "Data About: " + indicatorElement.textContent.trim();
      indicatorHeader.style.marginBottom = "10px";
      containerDiv.insertBefore(indicatorHeader, containerDiv.firstChild);
    }
  
    // Insert the entire container at the top of the body.
    document.body.insertBefore(containerDiv, document.body.firstChild);
  
    // Run an initial search.
    updateResults();
  
    // Log results to the console.
    console.log("Search executed. Use the UI above to modify the search.", defaultCountries);
  })();

// Author/Github:ungleicch
