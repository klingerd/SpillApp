var map;
var MAP_KEY="AIzaSyAvgbYjsYxgjOb3-Jt0bpv0EoLbJA7aRCs"; 
var LAST_YEAR=2017;
var FIRST_YEAR=1986;
var GEOCODING_ON=false;
	
  	this._loadSpillData();
  	this._loadGuideData();
  }
  _loadGuideData(){
  	 $.getJSON( "guide_data.json", this.onGuideLoad)
    .fail(function() {console.log( "guide load error" );});
  }
  _loadSpillData(){
	
 	$.ajax({
		url: "https://data.ny.gov/resource/dzn2-x287.json?$where=starts_with(waterbody,'HUDSON R')",
		type: "GET",
		data: {
		  "$limit" : 75000,
		  "$$app_token" : "6VuR0Szvnvt58kUl87cNa4tdF"
		}
	}).done(this.onSpillDataLoad);
  }

	render(){
		let loadingMsg="";
		if (!this.state.markersLoaded){
			loadingMsg=<div class="loading-label">loading data...</div>;
		}
		return(
				<div class="small-blue-text">Hudson River Spill Incidents in: </div>
				<h2 class="year-title">{year}</h2>
				<div class="six columns">
					<div class="map-container" >
						<div class="map-inner-container">
							<button class="year-button prev-year" type="button" onclick="{this.changeYear(false).bind(this)}">{year-1}"</button>
							{loadingMsg}
							<div id="map"></div>
							<button class="year-button next-year" type="button" onclick="{this.changeYear(true).bind(this)}">{year+1}</button>
						</div> 
					</div>
				</div>
				<div class="six columns">
					<div class="info-container"></div>
					<div class="guide-sheet"></div>
				</div>
		);	
	}