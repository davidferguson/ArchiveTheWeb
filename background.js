/*
ArchiveTheWeb Chrome Extension
Version 0.0.2
by David Ferguson

With thanks to everyone at the Internet Archive - this extension is in support
of their great work!
Please not that this extension sends the URLs of *all* the pages you visit to
be archived by the WayBack Machine. This means that if the URL contains private
or sensitive information (like in GET parameters), that will be sent to the
WayBack Machine. If you're doing anything with sensitive information please
make sure you have disabled this extension beforehand.
*/


/*
On install, set the counter of the number of pages the user has archived to 0,
and set the enabled of this extension to true. This will not run when the extension
is updated, only when it is newly installed.
*/
chrome.runtime.onInstalled.addListener(function(details)
{
	if( details.reason == "install" )
	{
		chrome.storage.sync.set(
		{
			enableArchiving: 1,
			archiveCount: 0
		});
	}
});

/*
This code listens out for messages from the content script of this extension. The
content script is a javascript file (archive.js) that is run every time a page is
loaded. Basically the content script sends us a message with the URL of the page
to archive.
It is necessary to have this message passing system becuase in the below code, an
AJAX request is made to fine out whether we should attempt to archive the page, and
this AJAX request is to a website over http (not https). Therefore, it the below
code was on the content script, the AJAX request would be made as part of that web
page, and it would fail on https websites due to security reasons. The easiest way
to get round that was to have the background script do all the work, as it is loaded
over the chrome:// protocol, which doesn't have the restrictions https has.
The below code basically just waits for messages, and runs the function archive(url)
whenever it recceives one.
*/
chrome.extension.onMessage.addListener(function(request, sender, sendResponse)
{
	var url = request.data;
	archive(url);
});

/*
The main archive function. It Runs whenever a message is received from a content
script. As an overview, what it does is checks to see if this plugin is enabled, and
if it is, encodes the URL of the page we want to archive and sends it to the URL
http://web.archive.org/cdx/search/xd?url= which returns a list of the times that
the URL has been archived. I wanted to use the Wayback Machine API for this, but I
found that some webpages didn't return a value even though they had been archived,
and seeing as this way worked there was no need to investigate why that was
happening. We then extract the latest timestamp from the result we get, and use the
function timeSince to see if it has been 24 hours since the last crawl. If it has,
the archiveWebsite function is used to go and actually crawl the website.
*/
function archive(pageUrl)
{
	chrome.storage.sync.get(
	{
		enableArchiving: 1
	}, function(items)
	{
		if( items.enableArchiving )
		{
			var encodedUrl = encodeURIComponent(pageUrl);
			try
			{
				var lastArchiveRequest = new XMLHttpRequest();
				lastArchiveRequest.onreadystatechange = function()
				{
					if ( lastArchiveRequest.readyState == 4 && lastArchiveRequest.status == 200 )
					{
						var archiveResponse = lastArchiveRequest.responseText;
						if( archiveResponse == "" )
						{
							archiveWebsite( pageUrl );
						}
						else
						{
							archiveResponse = archiveResponse.split("\n");
							archiveResponse = archiveResponse[archiveResponse.length-2];
							var archiveTimestamp = archiveResponse.split(" ")[1];
							var timeDifference = timeSince( archiveTimestamp );
							if( timeDifference > (1000 * 3600 * 24) )
							{
								archiveWebsite( pageUrl );
							}
							else
							{
								console.log("URL " + pageUrl + " has already been archived in the past 24 hours. Not archiving");
							}
						}
					}
				};
				lastArchiveRequest.open("GET", "http://web.archive.org/cdx/search/xd?url=" + encodedUrl + "&cachePrevent=" + (Math.floor((Math.random() * 99999) + 1)), true);
				lastArchiveRequest.send();
			}
			catch(e)
			{
				archiveWebsite( pageUrl );
			}
		}
	});
}

/*
This function is used to actually archive the website. It just sends a request to
the URL https://web.archive.org/save/<pageUrl> which tells the WayBack machine to
go and archive it.
This AJAX request can and does fail (quite a bit actually), as it will return an
error code if the WayBack machine can not archive it. So don't worry if we get a
few error codes coming up from here!
If the WayBack Machine can archive it, then the AJAX request will be completed
succesfully. In this case, run the addToCount function.
*/
function archiveWebsite( pageUrl )
{
	console.log("Archiving URL " + pageUrl);
	var archiveUrl = "https://web.archive.org/save/" + pageUrl;
	var archiveRequest = new XMLHttpRequest();
	archiveRequest.onreadystatechange = function()
	{
		if ( archiveRequest.readyState == 4 && archiveRequest.status == 200 )
		{
			addToCount();
		}
	};
	archiveRequest.open("GET", archiveUrl, true);
	archiveRequest.send();
}

/*
Just a fun feature of this extension. This function is run every time a succesful
request is made to the WayBack Machine to archive the page. All it does it add 1 to
a Chrome storage container so that the user can see how many pages that they have
personally helped archive.
*/
function addToCount()
{
	console.log("Archivng succesful - adding 1 to count");
	chrome.storage.sync.get(
	{
		archiveCount: 0
	}, function(items)
	{
		chrome.storage.sync.set(
		{
			archiveCount: items.archiveCount + 1
		});
	});
}

/*
This function is called by the archive function, and takes the paramater of the
timestamp (YYYMMDDhhmmss) of the last crawl of the URL, and compares it to the current
time and date. This function returns the difference between those two dates in
milliseconds.
*/
function timeSince( archiveTimestamp )
{
	var lastArchiveYear = archiveTimestamp.substring(0,4);
	var lastArchiveMonth = archiveTimestamp.substring(4, 6) - 1;
	var lastArchiveDay = archiveTimestamp.substring(6,8);
	var lastArchiveHour = archiveTimestamp.substring(8,10);
	var lastArchiveMinute = archiveTimestamp.substring(10,12);
	var lastArchiveSecond = archiveTimestamp.substring(12,14);
	var lastArchiveDate = new Date(Date.UTC(lastArchiveYear, lastArchiveMonth, lastArchiveDay, lastArchiveHour, lastArchiveMinute, lastArchiveSecond));
	var now = new Date(); 
	var utcNow = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
	var millisDifference = Math.abs(utcNow.getTime() - lastArchiveDate.getTime());
	return millisDifference;
}
