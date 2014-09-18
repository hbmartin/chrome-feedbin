// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// Copyright (c) 2013 Harold Martin.
var subscribed = {};
var last_opened = Date.now();
chrome.extension.onMessage.addListener(function(request, sender) {
  if (request.msg == "feedIcon") {
    // First validate that all the URLs have the right schema.
    var input = [];
    for (var i = 0; i < request.feeds.length; ++i) {
      var a = document.createElement('a');
      a.href = request.feeds[i].href;
      if (a.protocol == "http:" || a.protocol == "https:") {
        input.push(request.feeds[i]);
      }
    }

    if (input.length == 0)
      return;  // We've rejected all the input, so abort.

    // We have received a list of feed urls found on the page.
    var feeds = {};
    feeds[sender.tab.id] = input;
    chrome.storage.local.set(feeds, function() {
      // Enable the page action icon.
      chrome.pageAction.setTitle(
        { tabId: sender.tab.id,
          title: chrome.i18n.getMessage("rss_subscription_subscribe_button") + ': ' + (feeds[sender.tab.id][0].title || feeds[sender.tab.id][0].href || chrome.i18n.getMessage("rss_subscription_unknown_feed_name"))
        });
		// TODO: loop thru feeds
		if (!subscribed[feeds[sender.tab.id][0].href]) {
      	  chrome.pageAction.show(sender.tab.id);
	    }
	  chrome.pageAction.onClicked.addListener(function(tab) {
		chrome.pageAction.setIcon( {
			  tabId: sender.tab.id,
  				  path: { "19": "icon/gray.png", "38": "icon/gray@2x.png" }
        });
        chrome.pageAction.setTitle(
          { tabId: sender.tab.id,
            title: '...'
          });
		  if (!localStorage['http_auth']) {
		      var username = prompt("Please enter your Feedbin username");
		      var pass = prompt("Please enter your Feedbin password");
		    if (pass !== null && pass !== "" && pass !== undefined && pass !== false) {
		      localStorage['http_auth']= "Basic " + btoa(username + ":" + pass);
		     }
		  }
		  if (subscribed[feeds[sender.tab.id][0].href]) {
			chrome.pageAction.setIcon( {
				  tabId: sender.tab.id,
    				  path: { "19": "icon/green.png", "38": "icon/green@2x.png" }
	        });
			if ((Date.now() - last_opened) > 4000) {
				window.open('https://feedbin.me/','_blank');
				last_opened = Date.now();
			}
		  }
		  else {
			  alert('really subscribe?')
			  var xhr = new XMLHttpRequest();
		      xhr.open("POST", "https://api.feedbin.me/v2/subscriptions.json", true);
		      xhr.setRequestHeader("Authorization", localStorage['http_auth']);
			  xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
		      xhr.onreadystatechange = function() {
		        if (xhr.readyState == 4) {
					if (xhr.status >= 400) {
						chrome.pageAction.setIcon( {
							  tabId: sender.tab.id,
	          				  path: { "19": "icon/red.png", "38": "icon/red@2x.png" }
				        });
				        chrome.pageAction.setTitle(
				          { tabId: sender.tab.id,
				            title: chrome.i18n.getMessage("rss_subscription_error_fetching")
				          });	
					} else {
						var rj = JSON.parse(xhr.responseText);
						if (rj.feed_id) {
							subscribed[rj.feed_url] = rj.feed_id;
							chrome.pageAction.setIcon( {
								  tabId: sender.tab.id,
		          				  path: { "19": "icon/green.png", "38": "icon/green@2x.png" }
					        });
					        chrome.pageAction.setTitle(
					          { tabId: sender.tab.id,
					            title: "Succesfully subscribed!"
					          });
						}
					}
		        }
		      };
		      xhr.send('{ "feed_url": "' + feeds[sender.tab.id][0].href + '" }');
		  }
	  });
    });
  } else if (request.msg == "feedDocument") {
	  // TODO
    // We received word from the content script that this document
    // is an RSS feed (not just a document linking to the feed).
    // So, we go straight to the subscribe page in a new tab and
    // navigate back on the current page (to get out of the xml page).
    // We don't want to navigate in-place because trying to go back
    // from the subscribe page takes us back to the xml page, which
    // will redirect to the subscribe page again (we don't support a
    // location.replace equivalant in the Tab navigation system).
    chrome.tabs.executeScript(sender.tab.id,
        { code: "if (history.length > 1) " +
                 "history.go(-1); else window.close();"
        });
    var url = "subscribe.html?" + encodeURIComponent(request.href);
    url = chrome.extension.getURL(url);
    chrome.tabs.create({ url: url, index: sender.tab.index });
  }
});

chrome.tabs.onRemoved.addListener(function(tabId) {
  chrome.storage.local.remove(tabId.toString());
});

if (localStorage['http_auth']) {
	var xhr = new XMLHttpRequest(), i;
	xhr.open("GET", "https://api.feedbin.me/v2/subscriptions.json", true);
	xhr.setRequestHeader("Authorization", localStorage['http_auth']);
	xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
	xhr.onreadystatechange = function() {
	  if (xhr.readyState == 4) {
		feeds = JSON.parse(xhr.responseText);
	    for (i in feeds) { if(feeds.hasOwnProperty(i)) {
			subscribed[feeds[i].feed_url] = feeds[i].feed_id;
	    }}
	  }
	};
	xhr.send();
}
