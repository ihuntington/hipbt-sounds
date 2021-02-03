# [HIPBT](https://www.haveiplayedbowie.today) x BBC Sounds

This is a rough initial version of an integration for Have I Played Bowie Today and BBC Sounds. The goal is to send what I listen to on BBC Sounds to HIPBT in order to capture my listening history.

This only works with on demand content and has some hard coded URLs to my local test site.

## How does this work?

I have created a bookmarklet which inserts a Javascipt to the page if the location is www.bbc.co.uk and then inserts an iframe onto the page. The initial script adds event listeners to the BBC Sounds media player and uses `window.postMessage` to send data to the iframe which is hosted on HIPBT. From there the data is sent as a POST request to a makeshift API endpoint.

## Goals

- Add support for live radio
- Add more information to the app
- Add some tests
- Give the app some visual flourish
