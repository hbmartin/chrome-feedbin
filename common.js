// Copyright (c) 2010 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Whether we can modify the list of readers.
var storageEnabled = window.localStorage != null;


/**
* Find an element with |id| and replace the text of it with i18n message with
* |msg| key.
*/
function i18nReplaceImpl(id, msg, attribute) {
  var element = document.getElementById(id);
  if (element) {
    if (attribute)
      element.setAttribute(attribute, chrome.i18n.getMessage(msg));
    else
      element.innerText = chrome.i18n.getMessage(msg);
  }
}

/**
* Same as i18nReplaceImpl but provided for convenience for elements that have
* the same id as the i18n message id.
*/
function i18nReplace(msg) {
  i18nReplaceImpl(msg, msg, '');
}
