/*
This file is run whenever a new page is loaded.
All we're doing is sending a message to the background script, which will go
and archive the page for us.
*/

function archivePage()
{
	// Archive the HTML of this page
	chrome.extension.sendMessage(
	{
		data: window.location.href
	});

	// Archive all the images on this page
	var images = document.getElementsByTagName("img");
	for (var i = 0; i < images.length; i++)
	{
		chrome.extension.sendMessage(
		{
			data: images[i].src
		});
	}

	// Archive all the scripts on this page
	var images = document.getElementsByTagName("script");
	for (var i = 0; i < images.length; i++)
	{
		chrome.extension.sendMessage(
		{
			data: images[i].src
		});
	}

	// Archive all the css and favicons on this page
	var images = document.getElementsByTagName("link");
	for (var i = 0; i < images.length; i++)
	{
		chrome.extension.sendMessage(
		{
			data: images[i].href
		});
	}
}


archivePage();

// Constantly check to see if the URL has changed, and if so, archive the page again
var oldLocation = location.href;
setInterval(function()
{
	if(location.href != oldLocation)
	{
		archivePage();
		oldLocation = location.href
	}
}, 5000);
