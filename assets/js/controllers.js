
myapp.controller('appBgCtrl', ['$scope', function($scope){
    $("body").removeClass('body-login');
    $("body").addClass('body-app');
}]);

myapp.controller('loginBgCtrl', ['$scope', function($scope){
    $("body").removeClass('body-app');
    $("body").addClass('body-login');
}]);


myapp.controller('signupCtrl',['$scope','$location','AuthService', function($scope, $location, AuthService){
	$scope.user = true;
    $scope.organization = false
    $scope.message = false;
    
    $scope.nextOrg = function(fullname, email, password){
        $scope.user = false;
        $scope.organization = true;
        $scope.fullname = fullname;
        $scope.email = email;
        $scope.password = password;
    }
    
	$scope.sign_up = function(fullname, email, password, org_name, org_type){
        
        $scope.error = false;
        $scope.disable = true;
        var status = false;
        
        // call register service
        AuthService.registerNgo(org_name, org_type)
            // handle success
            .then(function(){
                $scope.disabled = false;
                status = true;
            })
            // handle error
            .catch(function(){
                $scope.disabled = true;
            });
        
        // call register user service
        if (status){
            var ngo_id = AuthService.getNgo();
            AuthService.registerUser(fullname, email, password, ngo_id)
                // handle success
                .then(function(){
                    $location.path('/signin'); 
                })
                // handle error
                .catch(function(){
                    $scope.message = true;
                });
        }
	}
	
}]);

myapp.controller('signinCtrl', ['$scope', '$http','$location','AuthService', function($scope,$http,$location,AuthService ){
    $("body").removeClass('body-app');
    $("body").addClass('body-login');
    $scope.message = false;
    $scope.sign_in = function(username, password){
        var data = '{"username":"'+username+'","password":"'+password+'"}';
        
        AuthService.login(data)
            .then(function(){
                $location.path('/app');
            })
            .catch(function(){
               $scope.message = true;
            });
    }
    
}]);







myapp.controller('excelFileCtrl', ['$scope', 'Upload', '$timeout','$window','$http','$location','AuthService', function ($scope, Upload, $timeout, $window, $http, $location, AuthService) {
    $("body").removeClass('body-login');
    $("body").addClass('body-app');
    
    var ngo_id =  restoreNgo();
    var url ="http://0.0.0.0:5000/api/v1/ngo/"+ngo_id;
    
    $http.get(url).success(function(data,status, header, config){
		$scope.ngo_name = data.ngo.name;
	})
	.error(function(data, status, header, config){
		
	});
          
    
    
    $scope.logout = function () {
      // call logout from service
       
      AuthService.logout()
        .then(function () {
           alert("Remy");
          $location.path('/signin');
        });

    };

    
    
    $scope.box_data_one = true; 
    $scope.box_data_two = false;
    
    //$scope.sg_number = 100;
    
	$scope.upload_File = function(file) {
		file.upload = Upload.upload({
			url: 'http://0.0.0.0:5000/api/upload/',
			data: {file: file},
		});

		file.upload.then(function (response) {
			$timeout(function () {
				console.log(response.data);
                if(!response.data.status){
                    console.log(response.data);
                    postFailFile(response.data.originalpath, response.data.savepath, response.data.filename)
                    $scope.box_data_one = false;
                    $scope.box_data_two = true;
                    $scope.savepath = response.data.savepath;
                    $scope.filename = response.data.filename;
                }else{
                    closeNav();
                    openNav1();
                    renderView(response.data);
                    $scope.originalpath = response.data.originalpath;
                    $scope.filename_save = response.data.filename;
                }
			});
		}, function (response) {
			if (response.status > 0)
				$scope.errorMsg = response.status + ': ' + response.data;
		}, function (evt,response) {
				// Math.min is to fix IE which reports 200% sometimes
				file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
				if(file.progress == 100){
                    
				}
			});
		}
    
    function postFailFile(original, save, filename){
        var id = restoreUser();
        var config = {
			headers:{
				'Content-Type':'application/json'
			}
        }
        
        var data = '{"original":"'+original+'","save":"'+save+'","user_id":"'+id+'","filename":"'+filename+'"}';
    
        $http.post('http://0.0.0.0:5000/api/v1/file/save/', data, config)
        .success(function(data, status, header, config){
            console.log(data);
        });
    }
    
    
    function renderView(data){
        if(data.json.length == 1){
            
        }else{
            console.log(data.json);
            multipleDataView(data.json);
        }
    }
    
    
    function multipleDataView(json_data){
        var year = [], member = [], female = [], male = [], ngo = [], partner = [], saved = [], loan = [], sg = [], status = [], location = [];
        
        $.each(json_data, function(key, value){
            item = [];
            item.push(value['province'], value['district'], value['sector']);
            location.push(item);
            ngo.push(value['funding_ngo']);
            partner.push(value['partner_ngo']);
            if(value['saved_amount_as_of_december_2014'] != 'N/A'){
                saved.push(parseInt(value['saved_amount_as_of_december_2014']));
            }
            if(value['outstanding_loans_as_of_december_2014'] != 'N/A'){
                loan.push(parseInt(value['outstanding_loans_as_of_december_2014']));
            }
            sg.push(value['saving_group_name']);
            female.push(parseInt(value['sgs_members__female']));
            male.push(parseInt(value['sgs_members__male_']));
            member.push(parseInt(value['sgs_members_total']));    
            status.push(value['sgs_status']);
            year.push(parseInt(value['sgs_year_of_creation']));
        });
        
        $scope.sg_number = sg.length;
        var min_year = Math.min.apply(Math, year);
        var max_year = Math.max.apply(Math, year);
        $scope.year_creation = min_year +" to "+max_year;
        $scope.total_member = member.reduce(add, 0);
        $scope.total_female = female.reduce(add, 0);
        $scope.total_male = male.reduce(add, 0);
        $scope.partner_number = unique(partner).length;
        $scope.ngo_number = unique(ngo).length;
        $scope.total_loan = loan.reduce(add, 0);
        $scope.total_saved = saved.reduce(add, 0);
        var status_dump = compressArray(status);
        console.log(status_dump);
        if (status_dump[0].value == 'Supervised'){
            $scope.supervised_num = status_dump[0].count;
            $scope.graduated_num = status_dump[1].count;
        }else{
            $scope.supervised_num = status_dump[1].count;
            $scope.graduated_num = status_dump[0].count;
        }
            
        
        
       console.log(loan);
       console.log(saved);
       console.log(location);
        
    }
    
    
    function add(a, b) {
        return a + b;
    }
    
    
    function unique(list) {
        var result = [];
        $.each(list, function(i, e) {
            if ($.inArray(e, result) == -1) result.push(e);
        });
        return result;
    }

    
    $scope.saveData = function(originalpath, filename){
        var config = {
			headers:{
				'Content-Type':'application/json'
			}
		}
        var user_id =  restoreUser();
        
        var data = '{"original":"'+originalpath+'","save":"","user_id":"'+user_id+'","filename":"'+filename+'"}';
    
        $http.post('http://0.0.0.0:5000/api/v1/file/user/', data, config)
        .success(function(data, status, header, config){
            
            if(data.auth){
                console.log(data);
                $("#side-content-data").hide();
                $("#side-content-saved").show();
            }
        });
        
    
    }
    
    
    $scope.signout = function(){
        var destroy = destroyUser();
        if(destroy){
            $location.path("/logout")
            
        }

    }
    
     
   
    
    
}]);








function storeUser(User){
	localStorage.setItem('u___', User);
	return 1;
}

function storeJson(json){
    localStorage.setItem('j___', json);
}


function restoreUser(){
	var user_id = localStorage.getItem('u___');
	return user_id;
}

function destroyUser(){
	localStorage.removeItem('u___');
	return 1;
}

function storeNgo(id){
    localStorage.setItem('n___', id);
}

function restoreNgo(){
    var ngo_id = localStorage.getItem('n___');
    return ngo_id;
}



function openNav() {
    document.getElementById("mySidenav").style.width = "50%";
    document.body.style.backgroundColor = "#fff";
    document.getElementById("call-opacity").className = "opacity";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    document.body.style.backgroundColor = "white";
    document.getElementById("call-opacity").className = "";
}

function openNav1() {
    document.getElementById("mySidenav1").style.width = "50%";
    document.body.style.backgroundColor = "#fff";
    document.getElementById("call-opacity").className = "opacity";
}

function closeNav_() {
    document.getElementById("mySidenav1").style.width = "0";
    document.body.style.backgroundColor = "#fff";
    document.getElementById("call-opacity").className = "";
}
