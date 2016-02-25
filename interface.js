/*
This page is run when the ArchiveTheWeb extension icon is clicked, and the popup
window is displayed. When that happens, we need to set a few things on that page,
namely the value of the checkbox, and the value of the counter.
*/

/*
As described above, retrieve a few values from the Chrome storage area, and set
the checkbox and counter on the interface window accordingly.
*/
chrome.storage.sync.get(
{
	archiveCount: 0,
	enableArchiving: 1
}, function(items)
{
	document.getElementById("pageCount").innerHTML = items.archiveCount;
	document.getElementById("enable").checked = items.enableArchiving;
});

/*
Whenever the checkbox is clicked, we need to set the Chrome storage container that
holds whether the extension is enabled or not to the appropriate value.
*/
document.getElementById("enable").addEventListener("click", function()
{
	chrome.storage.sync.set(
	{
		enableArchiving: document.getElementById("enable").checked
	});
});