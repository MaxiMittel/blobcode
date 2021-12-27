//TODO: Improve
document.getElementsByTagName("html")[0].style.backgroundColor = "#252526";

setTimeout(() => {
    document.getElementsByTagName("html")[0].style.backgroundColor = window.getComputedStyle(document.getElementsByClassName("monaco-workbench")[0]).getPropertyValue('--vscode-menu-background');
}, 4000);