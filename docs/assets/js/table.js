document.addEventListener('DOMContentLoaded', function() {
    const table = document.querySelector("table tbody");
    const headerType = document.querySelector("table th:nth-child(2)");
    const headerId = document.querySelector("table th:nth-child(1)");

    let originalRows = Array.from(table.querySelectorAll("tr"));

    function sortByTypeAndId(rows) {
        const order = ["semantic", "safe", "unsafe", "idempotent"];

        rows.sort((a, b) => {
            const typeA = a.querySelector("td:nth-child(2)").textContent;
            const typeB = b.querySelector("td:nth-child(2)").textContent;

            const idA = a.querySelector("td:nth-child(1) a").textContent;
            const idB = b.querySelector("td:nth-child(1) a").textContent;

            const indexA = order.indexOf(typeA);
            const indexB = order.indexOf(typeB);

            // Compare by type
            if (indexA !== indexB) return indexA - indexB;

            // If types are the same, compare by id
            if (idA < idB) return -1;
            if (idA > idB) return 1;
            return 0;
        });
    }

    table.addEventListener("click", function(event) {
        let target = event.target;

        if (target.tagName === "TD" && target.cellIndex === 1) { // If the type column is clicked
            let typeValue = target.textContent;
            let filteredRows = originalRows.filter(row => row.querySelector("td:nth-child(2)").textContent === typeValue);

            // Clear the table and append the filtered rows.
            while (table.firstChild) {
                table.removeChild(table.firstChild);
            }
            filteredRows.forEach(row => table.appendChild(row));
        }
    });

    headerType.addEventListener("click", function() {
        // Reset to original rows
        while (table.firstChild) {
            table.removeChild(table.firstChild);
        }
        originalRows.forEach(row => table.appendChild(row));
    });

    headerId.addEventListener("click", function() {
        const rows = Array.from(table.querySelectorAll("tr"));

        rows.sort((a, b) => {
            const idA = a.querySelector("td:nth-child(1) a").textContent;
            const idB = b.querySelector("td:nth-child(1) a").textContent;

            if (idA < idB) return -1;
            if (idA > idB) return 1;
            return 0;
        });

        // Clear the table and append the sorted rows.
        while (table.firstChild) {
            table.removeChild(table.firstChild);
        }
        rows.forEach(row => table.appendChild(row));
    });

    // Sort by type on page load
    sortByTypeAndId(originalRows);

    // Append the sorted rows
    while (table.firstChild) {
        table.removeChild(table.firstChild);
    }
    originalRows.forEach(row => table.appendChild(row));
});
