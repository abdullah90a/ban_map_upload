const SUPPLIERS = [];
const supplierRequest = new XMLHttpRequest();
const SUPPLIER_PLANS = document.getElementById("supplierPlans");
const CUSTOMER_SELECT = document.getElementById('customerSelect');

function storeSuppliers() {
    JSON.parse(this.responseText).suppliers.forEach(supplier => SUPPLIERS.push(supplier));
}

supplierRequest.onload = storeSuppliers;
supplierRequest.open('GET', `http://127.0.0.1:3000/suppliers`);
supplierRequest.send();

function renderCostTable() {
    const supplierPlan = JSON.parse(this.responseText);
    const planDiv = document.createElement("div");
    const planTable = document.createElement("table");
    const planRow = document.createElement("tr");
    planTable.appendChild(planRow);
    planDiv.appendChild(planTable)

    Object.keys(supplierPlan).forEach(customerSite => {
        const planCell = document.createElement("td");
        planRow.appendChild(planCell);

        planCell.innerHTML += `
            <h5>${customerSite}</h5>
            <ul>
                <li>$${parseInt(supplierPlan[customerSite].shippingCost)}</li>
                <li>From ${supplierPlan[customerSite].from}</li>
            </ul>
        `;
    });

    const supplierHeader = document.createElement("h4");
    supplierHeader.innerHTML = this.supplier;
    SUPPLIER_PLANS.appendChild(supplierHeader);
    SUPPLIER_PLANS.appendChild(planDiv);

}

CUSTOMER_SELECT.addEventListener('change', evt => {
    let selectedCustomer = evt.target.value;
    if (selectedCustomer === "invalid") { return; }
    else {
        SUPPLIER_PLANS.childNodes.forEach(node => SUPPLIER_PLANS.removeChild(node));
    }

    SUPPLIERS.forEach(supplier => {
        const supplierRequest = new XMLHttpRequest();
        supplierRequest.supplier = supplier;
        supplierRequest.onload = renderCostTable;
        supplierRequest.open('GET', `http://127.0.0.1:3000/plan/${selectedCustomer}/${supplier}`);
        supplierRequest.send();
    });
});