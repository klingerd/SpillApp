//TODO make more encapsulated:
var map;
var guideNotes;
var guideExists;
var selectedMarker;
var markers = [];
var placedMarkers = [];
var curYear=2017;
var lowZIndex=0;
var MAP_KEY="AIzaSyAvgbYjsYxgjOb3-Jt0bpv0EoLbJA7aRCs"; 
var LAST_YEAR=2017;
var FIRST_YEAR=1986;
var GEOCODING_ON=false;


///////TODO: move SpillMarker function prototype to another document; 
///////      have map and MAP_KEY passed in from onJSONLoad
///////  also change private vars and methods to start with underscore
function SpillMarker(data){
	this._placeWhenReady = false;
	this._gmMarker=null;
	this

	//TODO: get rid of year...
	this.year = data.spill_date.slice(0,4);
	this.date = new Date(data.spill_date);
	this.material_name = data.material_name;
	this.contributing_factor = data.contributing_factor;
	this.program_facility_name = data.program_facility_name.trim();
	//this.quantity = data.quantity;
	//this.units = data.units;
	//this.material_family = data.material_family;
	
	this._determinePosAndIcon(data);
}

SpillMarker.prototype._determinePosAndIcon=function(data){
	var strokeOpacity, color, estimatedGallons, spillRadius, preparedAddress, unitName;
	//ICON First:
	switch(data.material_family) {
		case "Petroleum":
			color="#000000";
			break;
		case "Hazardous Material":
			color="#c00000";
			break;
		case "Oxygenates":
			color="#007080";
			break;
		default:
			color="#905020";
	}
	////////// Check to make sure the data hasn't been corrupted //////
	// Originally, the circles would be different sizes corresponding to the     //
	// quantity spilled, but for half a week, the quantity values disappeared. //
	if(data.quantity != null && data.units != null){
		if(data.units=="Pounds"){
			estimatedGallons = data.quantity/6;
			unitName="lbs";
		}
		else{
			estimatedGallons = data.quantity;
			unitName="gal";
		}
		spillRadius=(Math.sqrt(estimatedGallons/10)) + 5;
		//maybe take out this size limit:
		if(spillRadius>25){
			spillRadius=25;
		}
		strokeOpacity=1;
		if(estimatedGallons==0){
			//strokeOpacity=.4;
			spillRadius=7;
			this.amount="";
		}
		else{
			this.amount=" ("+ data.quantity + unitName +")";
		}
	}
	else{
		spillRadius=7;
		//strokeOpacity=1;
		this.amount="";
	}
	
	this.icon={
		path: google.maps.SymbolPath.CIRCLE,
		strokeWeight: 1,
		fillOpacity : .4,
	    scale: spillRadius,
		//strokeOpacity: strokeOpacity,
		strokeColor: color,
		fillColor: color
	};
	
	//Now for the POSITION:
	if(data.location_1 != null){
		this._position = {
			lat: data.location_1.coordinates[1], 
			lng: data.location_1.coordinates[0]
		};
	}
	else if(GEOCODING_ON){
		if(data.location_1_address!=null){
			preparedAddress=data.location_1_address + "," +
				data.location_1_city + ",NY";
		}
		else if(data.locality!=null && data.street_1 != null){
			preparedAddress=data.street_1+","+data.locality+",NY";
		}
		else if(data.street_1 != null){
			preparedAddress=data.street_1+","+data.county+",NY";
		}
		else{
			return -1;
		}
		
		preparedAddress=preparedAddress.replace(/ /g, '+');
		
		$.getJSON("https://maps.googleapis.com/maps/api/geocode/json?address="+preparedAddress+"&key="+MAP_KEY, 
			this.onGeocoded.bind(this));
	}	
};


// creates new marker and puts it on the map.
SpillMarker.prototype._setGmMarker = function(){
	this._gmMarker=new google.maps.Marker({
				position: this._position,
				icon: this.icon,
				zIndex: 20 - this.icon.scale,
				map: map
			});
	this._gmMarker.addListener('mouseover', this.onSelected.bind(this));
	this._gmMarker.addListener('mousedown', this.onSelected.bind(this));
	this._gmMarker.addListener('mouseout', this.onUnselected.bind(this));
	this._gmMarker.addListener('mouseup', this.onUnclicked.bind(this));
};
//makes the marker "appear" selected
SpillMarker.prototype._showSelected=function(){
	this.icon.strokeWeight=3;
	this._gmMarker.setIcon(this.icon);
};
//makes the marker "appear" unselected
SpillMarker.prototype._unshowSelected=function(){
	this.icon.strokeWeight=1;
	this._gmMarker.setIcon(this.icon);
};

//////PUBLIC METHODS   (technically they're all public - but we can pretend):

SpillMarker.prototype.place=function(){

	if(this._position != null){
		if(this._gmMarker == null){
			this._setGmMarker();
		}
		else{
			this._gmMarker.setMap(map);
		}
	}
	else{
		this._placeWhenReady=true;
	}
};
SpillMarker.prototype.remove=function(){
	if(this._gmMarker != null){
		this._gmMarker.setMap(null);
	}
	this._placeWhenReady=false;
};
SpillMarker.prototype.onUnclicked = function(){
	this._gmMarker.setZIndex(lowZIndex);
	lowZIndex--;
};
SpillMarker.prototype.onSelected = function(){
	if(selectedMarker!=null){
		selectedMarker._unshowSelected();
	}
	selectedMarker=this;
	this._showSelected();
	$('#info-placeholder').addClass('hidden');
	$('#info-sheet .date-div').text((this.date.getMonth()+1) + "/" + this.date.getDate());
	$('#spill-title').text(this.material_name);
	$('#spill-amount').text(this.amount);
	$('#spill-location').text(this.program_facility_name);
	$('#spill-factor').text(this.contributing_factor.toUpperCase());
	$('#info-sheet').removeClass('hidden');
	$('.guide-sheet').addClass('no-border');
	//console.log(this.data);
};
SpillMarker.prototype.onUnselected = function(){
	
	//this.icon.strokeWeight=1;
	//this._gmMarker.setIcon(this.icon);
};
SpillMarker.prototype.onGeocoded=function(geocode){
	var bkupSearchTerm, i,
		addComponents, 
		nyConfirmed=false;
	if( geocode.status == "OK"){
		addComponents = geocode.results[0].address_components;
		for(i=1; i<addComponents.length-1; i++){
			if(addComponents[i].short_name === "NY" || addComponents[i].short_name === "NJ"){
				nyConfirmed=true;
				break;
			}
		}
		if(nyConfirmed){
			this._position=geocode.results[0].geometry.location;
			if(this._placeWhenReady){
				this._setGmMarker();
			}
		}
		else{
			//console.log(geocode.results[0]);
			this._placeWhenReady=false;
		}
	}
	else{
		//console.log("ERROR:");
		//console.log(geocode);
		this._placeWhenReady=false;
	}
};

/////////////////////// END OF SpillMarker FUNCTION PROTOTYPE //////////////

function initMap() {
	updateYear();
    map = new google.maps.Map($('#map')[0], { 
  	zoom:6,
    center:{lat: 43, lng: -76},
   	backgroundColor:"#d8e8ff",
  	streetViewControl:false,
    mapTypeControl:false,
    maxZoom:15,
    minZoom:5,
    clickableIcons:false
  });
  	map.fitBounds({north: 43.5, south: 40.5, west: -76, east: -74});
  
    $.getJSON( "guide_data.json", onGuideLoad)
    .fail(function() {console.log( "guide load error" );});

	
 	$.ajax({
		url: "https://data.ny.gov/resource/dzn2-x287.json?$where=starts_with(waterbody,'HUDSON R')",
		type: "GET",
		data: {
		  "$limit" : 75000,
		  "$$app_token" : "6VuR0Szvnvt58kUl87cNa4tdF"
		}
	}).done(onJSONLoad);
}

function updateYear(){
	var nextDisabled = false , prevDisabled = false;
	$('#year-title').text(curYear);
	$('#prev-year').text(curYear-1);
	$('#next-year').text(curYear+1);
	if(curYear===LAST_YEAR){
		nextDisabled=true;
	}
	if(curYear===FIRST_YEAR){
		prevDisabled=true;
	}
	$('#next-year').prop("disabled",nextDisabled);
	$('#prev-year').prop("disabled",prevDisabled);
}

function onJSONLoad(data){
	var spill, i;

	for (i = 0; i < data.length; i++){
		spill=new SpillMarker(data[i]);
		if(spill.year == curYear){
			spill.place();
			placedMarkers.push(spill);
		}
		markers.push(spill);
  	}
  	$('.loading-label').addClass('hidden');
  	$('.img-container img').click(onImageClick);
}

function onImageClick(){
	var curGuide=guideNotes[curYear][0];
	
	map.setCenter(curGuide.map_link.coords);
	map.setZoom(curGuide.map_link.zoom);
	$('html, body').animate({
          scrollTop: $('#year-title').offset().top
        }, 400);
}

function updateArrow(){
	var rect;
	var offset=50;
	//TODO: keep track of if arrow is visible with a variable to cut out adding classes every scroll
	if(!guideExists){
		$('#read-more-arrow').addClass('invisible');
	}
	else{
		rect = $('.guide-sheet span')[0].getBoundingClientRect();

		if(rect.top + offset <= $(window).height()){
			$('#read-more-arrow').addClass('invisible');
		}
		else{
			$('#read-more-arrow').removeClass('invisible');
		}
	}
}

function onGuideLoad(data){
	guideNotes=data;
	guideExists=(guideNotes[curYear] != null);
	populateGuideSheet();
	updateArrow();
	$(window).scroll(updateArrow);
	$(window).resize(updateArrow);
	/*$(document).keydown(function(e) {
		switch(e.which) {
			case 37: changeYear(false);
			break;

			case 39: changeYear(true);
			break;

			default: return; // exit this handler for other keys
		}
		e.preventDefault(); // prevent the default action (scroll / move caret)
	});
	*/
}

function populateGuideSheet(){
	var curGuide;
	///for now, there is only ever one guide note entry per year
	if (!guideExists){
		$('.guide-sheet').addClass('hidden');
		$('.guide-sheet img-container').addClass('hidden');
	}
	else{
		curGuide=guideNotes[curYear][0];

		$('.guide-sheet span').text(curGuide.text);
		if (curGuide.map_link != null){
			$('.guide-sheet .img-container img').attr('src', curGuide.map_link.img);
			$('.guide-sheet .img-container').removeClass('hidden');
		}
		else{
			$('.guide-sheet .img-container').addClass('hidden');
		}
		$('.guide-sheet').removeClass('hidden');
	}
}

function changeYear(forward){
	if(forward){
		if(curYear<LAST_YEAR){
			curYear++;
			refreshMarkers();
		}
	}
	else if(curYear>FIRST_YEAR){
		curYear--;
		refreshMarkers();
	}
}

function refreshMarkers(){
	var spill, i;
	updateYear();
	guideExists=(guideNotes[curYear] != null);
	
	$('#info-sheet').addClass('hidden');
	$('#info-placeholder').removeClass('hidden');
	$('.guide-sheet').removeClass('no-border');
	if(selectedMarker!=null){
		selectedMarker._unshowSelected();
		selectedMarker=null;
	}
	//lowZIndex=0;
	populateGuideSheet();
	updateArrow();
	
	while(placedMarkers.length>0){
		placedMarkers.pop().remove();
	}

	for (i = 0; i < markers.length; i++){
		if(markers[i].year == curYear){
			markers[i].place();
			placedMarkers.push(markers[i]);
		}
  	}
  	//console.log(placedMarkers.length);
  	//console.log(map.getCenter().lat()+", "+map.getCenter().lng());
  	//console.log(map.getZoom());
}