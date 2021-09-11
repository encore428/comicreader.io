const API_URL = "https://xkcd.now.sh/";    // API for loading comics
// the rest are working variables.
let totalComics = 0;     // Upon page initial load, this is assigned the value of the total number of comics available on portal.
let pageSize = 3;        // Initial page size, it can be altered by the user.
let focusComic = 0;      // The serial number of the comic currently in focus, and is displayed in the centre.
                         // When the page size is large than 1, additional comics before and after it are displayed.
let loadedComics = [];   // Array of details of  required comics are loaded onto this array first before rendering.
let harvestCnt = 0;      // Acts as a counter to track the number of comics loaded into the array.
                         // Once the array is full, the comic rendering starts.


// const initLoad()
// This is invoked when the JS is loaded, 
// to fetch from API to obtain the serial number of the latest comics, to be used as focus comic.
// It then proceed to load a page of comics and render.
const initLoad = () => { 
    fetch(`${API_URL}?comic=latest`)
        .then(response => response.json())  // convert to json
        .then(json => {
			totalComics = json.num;
			// after fetching the latest comic, proceed to load a page, focus on latest comic, using current page size
			pageLoad(json.num, 0, 0);
         })
        .catch(err => console.log('Request Failed', err)); // Catch errors
}	


// const recycleComicSerial()
// args: num : the current Comic serial number.
// 1. num is the serial of the comic to be retrieved.
// 2. num should be in the range of 1 to totalComics, if it is, it is returned intact.
// 3. Because of paging up and down, num my be set to values outside the normal range.
//    When this happens, this function returns it to the normal range.
// 4. When num is 0, it refers to the latest comic, so value of totalComics is returned.
// 5. When num is negative, it refers to the comic counting backward from the end.
// 6. When num is larger than totalComics, is warps back to the beginning of the range.
// 7. It is assumed that num when passed in, is in the range of 
//    -totalComics + 1 to 2 x totalComics
const recycleComicSerial = (num) => {
    if ( num < 1) { return num + totalComics;}
    if ( num >totalComics ) { return num - totalComics;}
    return num;
}


// renderComics(): renders the loaded comics on to the HTML page
function renderComics() {
	const div = document.getElementById('comics');
	while (div.firstChild) {div.removeChild(div.lastChild);}
	div.className=`sm:grid sm:grid-cols-2 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-${pageSize}`
    for (let i=0; i< pageSize ;i++) {
		const div1 = document.createElement('div');
		div1.className = 'border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200';
			{
			let div1_1 = document.createElement('div');
			div1_1.className = 'p-6';
				{
				let p = document.createElement('p');
				p.innerHTML = `#${loadedComics[i].num} ${loadedComics[i].title}`;
				let img = document.createElement('img');
				img.className = 'block w-full bg-gray-800 border border-gray-800 rounded-md text-sm font-semibold text-white text-center hover:bg-gray-900';
				img.src = `${loadedComics[i].img}`;
				div1_1.appendChild(p);
				div1_1.appendChild(img);
				}
			div1.appendChild(div1_1);
			}
		div.appendChild(div1);
	}	
	pleaseWait(false);
}


// const: harvester() is called each time a comic json is successfully loaded.
// Desc: This callback function keeps track of comics fetched using harvestCnt.  Once
//       harvestCount matches pageSize, the HTML rendering can begin.
const harvester = () => {
	harvestCnt = harvestCnt + 1;
	if (harvestCnt === pageSize) {
		renderComics();
	}
}


// const: getComic(num, i) calls a fetch request to load a comic into loadedComic array.
// args:  num is the Comic# to load,
//        i is the slot number in loadedComics array to store the loaded comic.
// Desc:  Since fetch is a promise, callback harvester() is used to check for 
//        completion of fetching of all required comics.  Once the required number of
//        comics are fetched (as indicated by harvestCnt compared to pageSize), the
//        HTML rendering can begin.
const getComic = (num, i) => { 
    num = recycleComicSerial(num);
    fetch(`${API_URL}?comic=${num}`)
        // Handle success
        .then(response => response.json())  // convert to json
        .then(json => {
            loadedComics[i] = json;
            harvester();
         }) // return comic
        .catch(err => console.log('Request Failed', err)); // Catch errors
}	


// const: pageLoad = (goComic, pageMvnt, newPageSize=0): is called to load a fresh page of comics.
// args: goComic     is comic to focus on.  If it is 0, the focus remains at focusComic.
//                   When this is not zero, pageMvnt is ignored.
//       pageMvnt    is the page movement.  It noramlly assumes the values of -1, 0, or 1.
//                     -1 means to page up
//                      0 means to stay on curent page
//                     +1 means to page down
//                     page number is not tracked, instead it is the focusComic serial that is 
//                     modified so as to load another page of comics.
//       newPageSize is the new page size.  It should assume the values of 0, 1, 3, or 5.
//                   0 means no change.
function pageLoad(goComic, pageMvnt, newPageSize=0) {
	pleaseWait(true);
	if ((newPageSize===1) || (newPageSize===3) || (newPageSize===5)) {
		pageSize=newPageSize;
        document.getElementById('pageSz').value=pageSize;
	}
	if (goComic !== 0) {
		focusComic = goComic;
	} else {
		focusComic = recycleComicSerial(focusComic + pageMvnt * pageSize);
	}
    harvestCnt = 0;
    for (let i = 0; i < pageSize;i++) {
        getComic( focusComic - (Math.floor(pageSize/2))+i, i);
    }
}


// function pleaseWait(wait)
// This function disables touch points while pictures are loaded,
// and re-enables them when the loading is completed.
function pleaseWait(wait) {
	document.getElementById('btngocomic').disabled = wait;
	document.getElementById('gorand').disabled = wait;
	document.getElementById('pageSz').disabled = wait;
	document.getElementById('pageU').disabled = wait;
	document.getElementById('pageD').disabled = wait;
	if (wait) {
		document.getElementById("loading").classList.remove("hidden");
		document.getElementById('content').classList.add("hidden");
	} else {
		document.getElementById('loading').classList.add("hidden");
		document.getElementById("content").classList.remove("hidden");
	}
}


// function btnHandler: button click event handler to allow users to go to a specific comic 
//                   of serial as entered in a input field, or generated randomly.
function btnHandler(event) {
    event.preventDefault();
	switch(event.target.id) {
	    case ('gorand'):
			pageLoad(Math.floor(Math.random()*totalComics) + 1, 0, 0);
			break;
		case('pageU'): pageLoad(0, -1, 0); break;
		case('pageD'): pageLoad(0,  1, 0); break;
		case('pageSz'): 
		    pageLoad(0, 0, Number(document.getElementById('pageSz').value));
			break;
		case('goform'):
			let inpStr = document.getElementById('gocomic').value;
			if (inpStr==="") {
				alert(`Please enter the serial number of the Comics to view.`);
				document.getElementById('gocomic').focus();
			} else {
				if (isNaN(Number(inpStr))) {
					alert(`Please enter a valid number`);
					document.getElementById('gocomic').focus();
				} else if ((Number(inpStr) < 0) || (Number(inpStr) > totalComics)) {
					alert(`Please enter a number in the range from 0 to ${totalComics}.`);
					document.getElementById('gocomic').focus();
				} else {
					document.getElementById('gocomic').value = "";
					pageLoad(Number(inpStr), 0, 0);
				}
			}
			break;
		}
}


document.getElementById('goform').addEventListener('submit', btnHandler);
document.getElementById('gorand').addEventListener('click', btnHandler);
document.getElementById('pageU').addEventListener('click', btnHandler);
document.getElementById('pageD').addEventListener('click', btnHandler);
document.getElementById('pageSz').value=pageSize;
document.getElementById('pageSz').addEventListener('change', btnHandler);

initLoad();