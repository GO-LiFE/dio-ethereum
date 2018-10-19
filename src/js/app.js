App = {
    web3Provider: null,
    contracts: {},

    init: function() {
        return App.initWeb3();
    },

    initWeb3: function() {
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;    // injected web3 instance
            web3 = new Web3(App.web3Provider);
        } 
        else {
            App.web3Provider = null;
            web3 = null;
        }

        return App.initContract();
    },

    initContract: function() {
        $.getJSON('Dio.json', function(data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var DioArtifact = data;
            App.contracts.Dio = TruffleContract(DioArtifact);
            
            // Set the provider for our contract
            if (App.web3Provider) { 
                App.contracts.Dio.setProvider(App.web3Provider);
            }
            
            // Use our contract to retrieve and mark the adopted pets
            return App.show();
        });

        return App.bindEvents();
    },

    bindEvents: function() {
        $(document).on('click', '#btnCreateCovenant', App.handleCreateCovenant);
        $(document).on('click', '#btnCreateChallenge', App.handleCreateChallenge);
        $(document).on('click', '.btnEndorseCovenantWaiting', App.handleEndorseCovenantWaiting);
        $(document).on('click', '#btnTransfer', App.handleTransfer);
        $(document).on('click', '#btnSetCovenantSetupRate', App.handleSetCovenantSetupRate);
        $(document).on('click', '#btnSetChallengeRate', App.handleSetChallengeRate);
    },
    
    challenges : [],

    covenantsWaiting : [], 

    covenants : [], 
    
    covenantSetupRate : -1,

    challengeRate : -1,
    
    show : function() {
        var dioInstance;
        
        if (web3) { 
            web3.eth.getAccounts(function(error, accounts) {
                if (error) {
                    console.log(error);
                }

                var account = accounts[0];

                App.contracts.Dio.deployed().then(function(instance) {
                    dioInstance = instance;
   
                    return dioInstance.getNumChallenges.call();
                }).then(function(bigNumberChallenges) {
                    numChallenges = bigNumberChallenges.toNumber();
                    if (numChallenges == 0) {
                        $("#challengesToMe").html("<i>(您還沒有任何驗證請求)</i>");
                    }
                    else {
                        for (let i = 0; i < numChallenges; ++i) {
                            dioInstance.getChallenge.call(i).then(function(retChallenge) {
                                let [challengeChallenger, challengePhrase, challengeCreateTime] = retChallenge;
                                const challengeObj = {
                                    challenger : challengeChallenger,
                                    phrase : challengePhrase,
                                    createTime : challengeCreateTime.toNumber(),
                                };
                                App.challenges.push(challengeObj);
                                console.log(challengeObj);
                                
                                var challengesToMe = $('#challengesToMe');

                                var challengeTemplate = $('#challengeTemplate');
                                challengeTemplate.find('.challengeNumber').html("第 " + (i + 1) + " 則");
                                challengeTemplate.find('.challengeChallenger').html(challengeObj.challenger);
                                challengeTemplate.find('.challengePhrase').html(challengeObj.phrase);
                                challengeTemplate.find('.challengeCreateTime').html(new Date(challengeObj.createTime * 1000).toLocaleString());

                                challengesToMe.append(challengeTemplate.html());
                            });
                        }
                    }
                    return dioInstance.getNumCovenantsWaiting.call(account);
                }).then(function(bigNumberCovenantsWaiting) {
                    numCovenantsWaiting = bigNumberCovenantsWaiting.toNumber();
                    if (numCovenantsWaiting == 0) {
                        $("#covenantsWaitingForMyEndorsement").html("<i>(目前沒有待您簽署的聲明)</i>");
                    }
                    else {
                        for (let i = 0; i < numCovenantsWaiting; ++i) {
                            dioInstance.getCovenantsWaiting.call(account, i).then(function(retCovenantWaiting) {
                                let [covenantID, covenantContractor, covenantEndorser, covenantStatement, covenantState] = retCovenantWaiting;
                                const covenantObj = {
                                    id : covenantID.toNumber(),
                                    contractor : covenantContractor,
                                    endorser : covenantEndorser,
                                    statement : covenantStatement,
                                    state : covenantState.toNumber(),
                                };
                                App.covenantsWaiting.push(covenantObj);
                                console.log(covenantObj);
                                
                                var covenantsWaitingForMyEndorsement = $('#covenantsWaitingForMyEndorsement');
                                
                                var covenantWaitingTemplate = $('#covenantWaitingTemplate');
                                covenantWaitingTemplate.find('.covenantID').html("編號 : " + covenantObj.id);
                                covenantWaitingTemplate.find('.covenantContractor').html(covenantObj.contractor);
                                covenantWaitingTemplate.find('.covenantEndorser').html(covenantObj.endorser);
                                covenantWaitingTemplate.find('.covenantStatement').html(covenantObj.statement);
                                var covenantStateStr;
                                switch (covenantObj.state) {
                                    case 1 :
                                        covenantStateStr = "等待簽署";
                                        break;
                                    case 2 :
                                        covenantStateStr = "已成立";
                                        break;
                                    default : 
                                        covenantStateStr = "--";
                                        break;
                                }
                                covenantWaitingTemplate.find('.covenantState').html(covenantStateStr);
                                covenantWaitingTemplate.find('.btnEndorseCovenantWaiting').attr("data-id", i);
                                covenantsWaitingForMyEndorsement.append(covenantWaitingTemplate.html());
                            });
                        }
                    }
                    return dioInstance.getCovenantIndices.call(account);
                }).then(function(convenantIndices) {
                    if (convenantIndices.length == 0) {
                        $("#myCovenants").html("<i>(目前沒有任何與您有關的聲明)</i>");
                    }
                    else {
                        for (let i = 0; i < convenantIndices.length; ++i) {
                            dioInstance.getCovenant.call(convenantIndices[i].toNumber()).then(function(retCovenant) {
                                let [covenantID, covenantContractor, covenantEndorser, covenantStatement, covenantState] = retCovenant;
                                const covenantObj = {
                                    id : covenantID.toNumber(),
                                    contractor : covenantContractor,
                                    endorser : covenantEndorser,
                                    statement : covenantStatement,
                                    state : covenantState.toNumber(),
                                };
                                App.covenants.push(covenantObj);
                                console.log(covenantObj);
                                
                                var myCovenants = $('#myCovenants');
                                
                                var covenantTemplate = $('#covenantTemplate');
                                covenantTemplate.find('.covenantID').html("編號 : " + covenantObj.id);
                                covenantTemplate.find('.covenantContractor').html(covenantObj.contractor);
                                covenantTemplate.find('.covenantEndorser').html(covenantObj.endorser);
                                covenantTemplate.find('.covenantStatement').html(covenantObj.statement);
                                var covenantStateStr;
                                switch (covenantObj.state) {
                                    case 1 :
                                        covenantStateStr = "等待簽署";
                                        break;
                                    case 2 :
                                        covenantStateStr = "已成立";
                                        break;
                                    default : 
                                        covenantStateStr = "--";
                                        break;
                                }
                                covenantTemplate.find('.covenantState').html(covenantStateStr);

                                myCovenants.append(covenantTemplate.html());
                            });
                        }
                    }
                    return dioInstance.getCovenantSetupRate.call();
                }).then(function(covenantSetupRate) {
                    App.covenantSetupRate = covenantSetupRate;
                    $("#covenantSetupRate").attr("placeholder", "(現在資費 : " + web3.fromWei(App.covenantSetupRate, 'ether') + ")");
                    return dioInstance.getChallengeRate.call();
                }).then(function(challengeRate) {
                    App.challengeRate = challengeRate;
                    $("#challengeRate").attr("placeholder", "(現在資費 : " + web3.fromWei(App.challengeRate, 'ether') + ")");
                    return dioInstance.getNumCovenants.call();
                }).then(function(numCovenants) {
                    $("#numCovenants").html(32767 + numCovenants.toNumber());
                    return dioInstance.getTotalChallenges.call();
                }).then(function(totalChallenges) {
                    $("#totalChallenges").html(65535 + totalChallenges.toNumber());
                    return dioInstance.isOwned.call();
                }).then(function(isOwned) {
                    if (isOwned) {
                        $("#transferRow").show();
                        $("#setCovenantSetupRateRow").show();
                        $("#setChallengeRateRow").show();
                        $("#setCovenantSetupRate").attr("placeholder", "(現在資費 : " + web3.fromWei(App.covenantSetupRate, 'ether') + ")");
                        $("#setChallengeRate").attr("placeholder", "(現在資費 : " + web3.fromWei(App.challengeRate, 'ether') + ")");
                    }
                    
                    // Listen to events - do this at last
                    var eventCovenantSetuped = dioInstance.CovenantSetuped(function(error, result) {
                        if (!error)
                            console.log(result);

                        if (result.args.endorser == account) {
                            alert("有一個新的聲明要請您簽署背書喔!! 請見網頁內容")
                        }
                    });
                    var eventCovenantEndorsed = dioInstance.CovenantEndorsed(function(error, result) {
                        if (!error)
                            console.log(result);

                        if (result.args.contractor == account) {
                            alert("您有一個聲明已經被簽署背書了!! 請見網頁內容")
                        }
                    });
                    var eventChallengeSetuped = dioInstance.ChallengeSetuped(function(error, result) {
                        if (!error)
                            console.log(result);
                        
                        if (result.args.addressBeingChallenged == account) {
                            alert("您收到了一個新的驗證請求喔!! 請見網頁內容")
                        }
                    });
                }).catch(function(err) {
                    console.log(err.message);
                });
            });
        }
        else {
            $("#challengesToMe").html("<i>(無法對區塊鏈進行交易... &rArr; 請確認您有安裝 MetaMask 並密碼登入，或是透過 DApp 瀏覽器也請確認有給予授權連結了喔!!!)</i>");
        }
    }, 

    handleCreateCovenant : function(event) {
        event.preventDefault();
        
        var dioInstance;

        web3.eth.getAccounts(function(error, accounts) {
            if (error) {
                console.log(error);
            }

            var account = accounts[0];

            App.contracts.Dio.deployed().then(function(instance) {
                dioInstance = instance;

                var covenantEndorser = $('#covenantEndorser').val();
                var covenantStatement = $('#covenantStatement').val();
                var covenantSetupRate = $('#covenantSetupRate').val();
                
                // Validate user inputs
                var errMsg = "";
                if (!covenantEndorser.startsWith("0x")) {
                    errMsg += "簽署人地址應以 0x 為開頭\n";
                }
                if (!covenantStatement) {
                    errMsg += "聲明不應該為空\n";
                }
                if (!covenantSetupRate) {
                    errMsg += "資費不能為空\n"
                }
                if (!/^[\d\.]+$/.test(covenantSetupRate)) {
                    errMsg += "資費應為數值\n";
                }
                if (errMsg) {
                    alert(errMsg);
                    throw({"message": errMsg});
                }
                
                return dioInstance.setupCovenant(covenantEndorser, covenantStatement, {from: account, value: web3.toWei(covenantSetupRate)}).send();
            }).then(function(result) {
                console.log(result);
                alert("完成");
                location.reload();
            }).catch(function(err) {
                console.log(err.message);
            });
        });
    },

    handleCreateChallenge : function(event) {
        event.preventDefault();
        
        var dioInstance;

        web3.eth.getAccounts(function(error, accounts) {
            if (error) {
                console.log(error);
            }

            var account = accounts[0];

            App.contracts.Dio.deployed().then(function(instance) {
                dioInstance = instance;

                var addressBeingChallenged = $('#addressBeingChallenged').val();
                var challengePhrase = $('#challengePhrase').val();
                var challengeRate = $('#challengeRate').val();
                
                // Validate user inputs
                var errMsg = "";
                if (!addressBeingChallenged.startsWith("0x")) {
                    errMsg += "被驗證人的地址應以 0x 為開頭\n";
                }
                if (!challengePhrase) {
                    errMsg += "密語不應該為空\n";
                }
                if (!challengeRate) {
                    errMsg += "資費不能為空\n"
                }
                if (!/^[\d\.]+$/.test(challengeRate)) {
                    errMsg += "資費應為數值\n";
                }
                if (errMsg) {
                    alert(errMsg);
                    throw({"message": errMsg});
                }
                
                return dioInstance.setupChallenge(addressBeingChallenged, challengePhrase, {from: account, value: web3.toWei(challengeRate)}).send();
            }).then(function(result) {
                console.log(result);
                alert("完成");
                location.reload();
            }).catch(function(err) {
                console.log(err.message);
            });
        });
    },
    
    handleEndorseCovenantWaiting : function(event) {
        event.preventDefault();

        var covenantIdWaitingEndorse = $(this).data('id');
        var dioInstance;

        web3.eth.getAccounts(function(error, accounts) {
            if (error) {
                console.log(error);
            }

            var account = accounts[0];

            App.contracts.Dio.deployed().then(function(instance) {
                dioInstance = instance;
                
                var covenantWaiting = App.covenantsWaiting[covenantIdWaitingEndorse];
                
                return dioInstance.endorseCovenant(covenantWaiting.id, covenantWaiting.contractor, covenantWaiting.statement, {from: account});
            }).then(function(result) {
                console.log(result);
                if (result) {
                    alert("完成");
                }
                else {
                    alert("失敗");
                }
                location.reload();
            }).catch(function(err) {
                console.log(err.message);
            });
        });
    },    

    handleTransfer : function(event) {
        event.preventDefault();
        
        var dioInstance;

        web3.eth.getAccounts(function(error, accounts) {
            if (error) {
                console.log(error);
            }

            var account = accounts[0];
            var dioInstance;

            App.contracts.Dio.deployed().then(function(instance) {
                dioInstance = instance;
                var transferTo = $('#transferTo').val();
                var amount = $('#transferAmount').val();
                
                // Validate user inputs
                var errMsg = "";
                if (!transferTo.startsWith("0x")) {
                    errMsg += "account shall start with 0x\n";
                }
                if (!amount) {
                    errMsg += "amount cannot be empty\n"
                }
                if (!/^[\d\.]+$/.test(amount)) {
                    errMsg += "amount shall be a value\n";
                }
                if (errMsg) {
                    alert(errMsg);
                    throw({"message": errMsg});
                }
                
                return dioInstance.transfer(transferTo, web3.toWei(amount));
            }).then(function(result) {
                console.log(result);
                if (result) {
                    alert("完成");
                }
                else {
                    alert("失敗");
                }
                location.reload();
            }).catch(function(err) {
                console.log(err.message);
            });
        });
    },

    handleSetCovenantSetupRate : function(event) {
        event.preventDefault();
        
        var dioInstance;

        web3.eth.getAccounts(function(error, accounts) {
            if (error) {
                console.log(error);
            }

            var account = accounts[0];
            var dioInstance;

            App.contracts.Dio.deployed().then(function(instance) {
                dioInstance = instance;
                var rate = $('#setCovenantSetupRate').val();
                
                // Validate user inputs
                var errMsg = "";
                if (!rate) {
                    errMsg += "rate cannot be empty\n"
                }
                if (!/^[\d\.]+$/.test(rate)) {
                    errMsg += "rate shall be a value\n";
                }
                if (errMsg) {
                    alert(errMsg);
                    throw({"message": errMsg});
                }
                
                return dioInstance.setCovenantSetupRate(web3.toWei(rate), {from: account});
            }).then(function(result) {
                console.log(result);
                if (result) {
                    alert("完成");
                }
                else {
                    alert("失敗");
                }
                location.reload();
            }).catch(function(err) {
                console.log(err.message);
            });
        });
    },

    handleSetChallengeRate : function(event) {
        event.preventDefault();
        
        var dioInstance;

        web3.eth.getAccounts(function(error, accounts) {
            if (error) {
                console.log(error);
            }

            var account = accounts[0];
            var dioInstance;

            App.contracts.Dio.deployed().then(function(instance) {
                dioInstance = instance;
                var rate = $('#setChallengeRate').val();
                
                // Validate user inputs
                var errMsg = "";
                if (!rate) {
                    errMsg += "rate cannot be empty\n"
                }
                if (!/^[\d\.]+$/.test(rate)) {
                    errMsg += "rate shall be a value\n";
                }
                if (errMsg) {
                    alert(errMsg);
                    throw({"message": errMsg});
                }
                
                return dioInstance.setChallengeRate(web3.toWei(rate), {from: account});
            }).then(function(result) {
                console.log(result);
                if (result) {
                    alert("完成");
                }
                else {
                    alert("失敗");
                }
                location.reload();
            }).catch(function(err) {
                console.log(err.message);
            });
        });
    },
};

$(function() {
    $(window).load(function() {
        App.init();
    });
});
