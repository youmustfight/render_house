'use strict';

app.factory('Comment', function ($http, User) {
	return {
		getComments: function (comments){
			var populatedComments = [];
			comments.forEach( function (comment) {
				var user = new User({_id: comment.user});
				user.fetch().then(function (obj) {
					// console.log(obj);
					var newCommentObj = comment;
					newCommentObj.user = obj;
					populatedComments.push(newCommentObj);
				});
			});
			return populatedComments;
		}
	}
});