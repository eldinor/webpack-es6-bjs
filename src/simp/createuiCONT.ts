export function createUploadButton() {
  let wrapper = document.getElementById("nl-wrapper");
  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.setAttribute("id", "nl-wrapper");
    wrapper.style.position = "absolute";
    wrapper.style.top = "41px";
    wrapper.style.width = "400px";
    //    wrapper.style.left = "15px";
    wrapper.style.border = "1px solid cadetblue";
    wrapper.style.padding = "4px";
    wrapper.style.backgroundColor = "rgba(0.5, 0.5, 1, 0.5)";

    document.body.appendChild(wrapper);
  }

  let container = document.getElementById("nl-container");
  if (!container) {
    container = document.createElement("div");
    container.setAttribute("id", "nl-container");
    container.style.padding = "4px";
    wrapper.appendChild(container);
  }

  let fileInput = document.getElementById("loadFile");
  if (!fileInput) {
    fileInput = document.createElement("input");
    fileInput.setAttribute("id", "loadFile");
    fileInput.setAttribute("type", "file");
    fileInput.style.color = "transparent";
    console.log(fileInput);

    container.appendChild(fileInput);
  }

  let deleteButton = document.getElementById("deleteButton");
  if (!deleteButton) {
    deleteButton = document.createElement("button");
    deleteButton.setAttribute("id", "deleteButton");
    deleteButton.style.float = "right";
    deleteButton.innerText = "Delete";
    deleteButton.style.display = "none";

    deleteButton.style.border = "2px solid palevioletred";
    deleteButton.style.borderRadius = "5px";
    deleteButton.style.backgroundColor = "#7B1F07";
    deleteButton.style.color = "white";

    wrapper.appendChild(deleteButton);
  }
  let exportButton = document.getElementById("exportButton");
  if (!exportButton) {
    exportButton = document.createElement("button");
    exportButton.setAttribute("id", "exportButton");
    exportButton.style.float = "left";

    exportButton.innerText = "EXPORT";
    exportButton.style.display = "none";
    wrapper.appendChild(exportButton);
  }
  let checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.name = "saveAll";
  checkbox.value = "value";
  checkbox.id = "saveAll";
  checkbox.style.display = "none";

  let label = document.createElement("label");
  label.htmlFor = "saveAll";
  label.style.color = "teal";
  label.style.display = "none";
  label.id = "saveAllLabel";
  label.appendChild(document.createTextNode("Save All"));

  wrapper.appendChild(checkbox);
  wrapper.appendChild(label);
}
