(function(jQuery){

	var sprintWise = sprintWise || {};
	var pageLoadDelay = 8 * 1000; //seconds
	var sprintName = 'sprint';

	//Singleton class
	var Activity = {
		getActivityId: function(str){
			var id = '';
			var r = /(?:activity|act)+(?:\s)*(?:-)?(?:\s)*([0-9]*)(?:[\s-])*\w+/gi;
			var m = r.exec(str);

			if(!m){
				// r = /([0-9]*)(?:[\s-])*\w+/gi;
				// r = /([0-9]+)(?:[\s])*(?:[-])+/gi;
				r = /([0-9]+)(?:[\s])*(?:[-])+(?:[\s])+/gi;
				m = r.exec(str);
			}

			if(m){
				id = m[0].replace(/[^0-9]/gi, '');
			}
			return id;
		},

		getSprint: function(){
			var sprint = jQuery('#issuetable tbody tr:first td.customfield_10007').text() || '';
			sprint = _.last(sprint.split(','));

			if(!sprint){
				var err = '`Sprint` column is not selected to show. Please search and select the `sprint` columns from columns list.';
				console.error(err);
				alert(err);
				return;
			}

			return _.trim(sprint);
		},

		getSprintId: function(){
			var sprint = Activity.getSprint();
			var sprintId;
			if(sprint){
				sprintId = _.trim(sprint.replace(/\(.*/g, '').replace(/[^0-9]*/g, ''));
			}

			return sprintId;
		},

		getSprintName: function(){
			var sprint = Activity.getSprint();

			// var sprintName;
			// if(sprint){
			// 	sprintName = _.trim(sprint.replace(/\(.*/g, ''));
			// }

			return sprint;
		},

		getSprintDate: function(isFormat){
			var sprint = Activity.getSprint();
			var startDate = sprint.match(/\((.*)-/i);
			var endDate   = sprint.match(/\(.*-(.*)\)/i);
			
			isFormat = isFormat || false;

			function getDate(str){
				var dt;
				if(str){
					str = (str||'').replace(/^\s+|\s+$/gmi, '');
					var pattern = /(\d{1,}).*\s([a-zA-Z]+)/;
					var yr = (new Date()).getFullYear();
					dt = new Date(str.replace(pattern, yr + '-$2-$1'));

					if(isFormat){
						dt = dt.toISOString().substring(0, 10);
					}
				}

				return dt;
			}

			return { start: getDate(startDate && startDate[1]), end: getDate(endDate && endDate[1]) };
		},

		getReleasedActivityFromSprint2: function(){
		  sprintName = Activity.getSprintName();

		  if( jQuery('#issuetable tbody tr').size() == 0 ){
		  	var err = 'It is not JIRA issue report page. \nYou have to open the Activity JIRA issue report page.';
		  	console.error(err);
		  	alert(err);
		  	return;
		  }

		  var activities = [];
		  var activitiesObj = sprintWise[sprintName] || {};
		  var sprintDate = Activity.getSprintDate(true);
		  var sprintId = Activity.getSprintId();


		  jQuery('#issuetable tbody tr').each(function(n,o){
		    // console.log(o);

		    var issueId= jQuery(o).data('issuekey');
		    if(issueId){
			    var title = jQuery(o).find('td.summary .issue-link').text();
			    var id = Activity.getActivityId(title);

			    id = id || issueId.replace(/[^0-9]/g, '');
			    id = parseInt(id);
			    activities.push(id);

			    var releasedOn = jQuery(o).find('td.updated time').attr('datetime');
					if(releasedOn){
						releasedOn = releasedOn && new Date(releasedOn);
					}

			    activitiesObj[id] = {
							activityId: id,
							branchName: issueId,
							title: title,
							releasedOn: releasedOn,
							sprint: sprintId
						};

					// console.log('issueId =>', issueId);
				}
		  });

		  sprintWise[sprintName] = activitiesObj;
		  console.log(JSON.stringify(sprintWise));
		},

		// on filter page
		updateReleaseDate: function(activities){
			_.each(activities, function(sprint, key){
				_.map(sprint, function(o, activityId){
					var issuekey = o.branchName;
					var releasedOn = jQuery('tr[data-issuekey="' + issuekey + '"]').find('td.updated time').attr('datetime');
					if(!o.releasedOn){
						o.releasedOn = releasedOn && new Date(releasedOn);
					}
				});
			});
			console.log(JSON.stringify(activities));
		},

		collect: function(){
			Activity.getReleasedActivityFromSprint2();

			var nextPageBtn = $('.results-panel .pagination').find("a:contains('Next')").get(0);

			if(nextPageBtn){
				nextPageBtn.click();

				//Wait for sometime to load next page data through Ajax call
				setTimeout(Activity.collect, pageLoadDelay);
				alert('Loading next page. Please wait... ');
			}else{
				// Send the data to popup through messaging
				console.log('==== done ====');
				console.log(JSON.stringify(sprintWise));
				Activity.send(JSON.stringify(sprintWise));
			}
		},

		send: function(data){
			//Broadcast message to all listener (popup.js and background.js)
			chrome.runtime.sendMessage({action: 'popup.activities.released-list', from: 'content', data: data}, function(response){
				console.log(response.from, ':', response.message);
			});
		}
	};



	
	// Listen all messages
	chrome.runtime.onMessage.addListener(
	  function(request, sender, sendResponse) {

			console.log('pageLoadDelay =>', request.pageLoadDelay);

	    if (request.action == "content.activities.get-list"){
	    		console.log(request.from, ':', request.message);
	    		
	    		if(request.pageLoadDelay){
	    			pageLoadDelay = parseInt(request.pageLoadDelay) * 1000;
	    		}

	    		Activity.collect();
	        sendResponse({from: "content", message: 'Hi popup'});
	    }
	});
})(jQuery);