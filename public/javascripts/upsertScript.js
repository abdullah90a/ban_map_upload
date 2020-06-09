const UPSERT_TYPE_SELECTOR = document.getElementById('upsertTypeSelect');
UPSERT_TYPE_SELECTOR.addEventListener('change', evt => {
    SELECTED_TYPE = evt.target.value;
    getTypeData();
});

function getTypeData() {
    const request = new XMLHttpRequest();
    request.onload = createDataForm;
    request.open('GET', `http://127.0.0.1:3000/nuUpload/types/${SELECTED_TYPE}`);
    request.send();
}

const FORM_INPUT_AREA = document.getElementById('inputFields');
function createDataForm() {
    FORM_INPUT_AREA.innerHTML = '';
    // Just being edgy here...
    JSON.parse(this.responseText)
        .forEach((datum, index) => {
            const elementDiv = document.createElement('table');
            elementDiv.classList.add("nuUpsertTable");

            elementDiv.innerHTML += `<input name="_id_${index}" value="${datum._id}" hidden>`;
            const keysToRender = Object.keys(datum).filter(key => !(['_id', 'lat', 'lng'].includes(key)));
            keysToRender.forEach(key => {
                elementDiv.innerHTML += `
                    <tr class="nuUpsertRow">
                        <td>
                            <label class="nuUpsertLabel" for="${key + '_' + index}">${key}</label>
                        </td>
                        <td>
                            <input type="text" name="${key + '_' + index}" value="${datum[key]}">
                        </td>
                    </tr>
                `
            });

            FORM_INPUT_AREA.appendChild(elementDiv);
        });
}