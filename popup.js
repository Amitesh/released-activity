
(function(){

	var url = "https://mathletics.atlassian.net";

	function getReleases(){
		// Send Message to active tab page's content.js
	  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	  	
	  		if(tabs[0].url.indexOf(url) > -1){
		      chrome.tabs.sendMessage(tabs[0].id, {
		      	action: 'content.activities.get-list', 
		      	from: "popup", 
		      	message: 'Get released activities',
		      	pageLoadDelay: $('.page-load-delay').val()
		      }, function(response) {
		          console.log(response.from, ':', response.message);
		      });
		      $('.results').val('Please wait... ');
		      $('.result-box').show();
		    }else{
		    	showAlert({alertType: 'danger', message: 'Open JIRA issue page.'});
		    }
	  });
	}

	function open(){
		var sprintId 	= $('.sprint-id').val() || 377; // Sprint-17
		var query 		= 'project = ACTIVITY AND status = "Released to Live" AND Sprint = ' + sprintId + 
										' AND issueKey not in (ACTIVITY-1282,ACTIVITY-1283,ACTIVITY-1284, ACTIVITY-1285,ACTIVITY-1286, ACTIVITY-1287, ACTIVITY-1288) ORDER BY key ASC';
		url = url + '/issues/?jql=' + encodeURI(query);

		chrome.tabs.create({'url': url }, function(tab) {
	    // Tab opened.
	  });
	}

	function showAlert(data){
		var html = '<div class="alert alert-'+ data.alertType +'" role="alert">'+ 
			'<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
			data.message +'</div>';
		$('.popup-alert').html(html).fadeIn();
		$('.popup-alert .close').click(function(){
			$('.popup-alert').fadeOut();
		});
	}

	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			if(request.action == 'popup.activities.released-list'){
				console.log(request.from, ':', request.data);
				$('.results').val(request.data);
			}else if(request.action == 'popup.alert'){
				showAlert(request);
			}
	});



	$(document).ready(function(){
		$('.btn-open-issue-page').click(open);
		$('.btn-get-releases').click(getReleases);
	});

})();