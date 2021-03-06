// Copyright (c) 2012 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

(function() {
  var didLaunch = false;

  /**
   * Used to watch for launch events that occur before we're ready to handle
   * them. Only used when Secure Shell is running as a v2 app.
   */
  if (!!chrome.app.window) {
    var onLaunched = function() { didLaunch = true; };
    chrome.app.runtime.onLaunched.addListener(onLaunched);
  }

  /**
   * Used to watch for launch events that occur before we're ready to handle
   * them. Only used when Secure Shell is running as an extension.
   */
  if (nassh.browserAction) {
    const onLaunched = function() { didLaunch = true; };
    nassh.browserAction.onClicked.addListener(onLaunched);
  }

  /**
   * Perform any required async initialization, then create our app instance.
   *
   * The window.app_ property will contain the new app instance so it can be
   * reached from the background page's JS console.
   */
  lib.init(function nassh_background() {
    var manifest = chrome.runtime.getManifest();
    var app = new nassh.App(manifest);

    app.onInit.addListener(function() {
      if (!!chrome.app.window) {
        // Ready to handle launch events, no need for special handling anymore.
        chrome.app.runtime.onLaunched.removeListener(onLaunched);

        app.installHandlers(chrome.app.runtime);

        if (didLaunch)
        app.onLaunched();
      } else {
        console.log('background-page: init complete');
      }
    });
    app.installOmnibox(chrome.omnibox);

    // If we're running as an extension, finish setup.
    if (nassh.browserAction) {
      nassh.browserAction.onClicked.removeListener(onLaunched);
      app.installBrowserAction();
      if (didLaunch)
        app.onLaunched();
    }

    // "Public" window.app will be retrieved by individual windows via
    // chrome.getBackgroundPage().
    window.app = app;

    // A flag for people who need to load us dynamically to know we're ready.
    // See nassh.getBackgroundPage for the user.
    window.loaded = true;
  }, console.log.bind(console));
})();
