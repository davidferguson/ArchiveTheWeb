/*
This file is run whenever a new page is loaded.
All we're doing is sending a message to the background script, which will go
and archive the page for us.
*/

chrome.extension.sendMessage(
{
	data: window.location.href
});