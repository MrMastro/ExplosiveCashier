/* Per funzionarlo ha bisogno del plugin file
cordova plugin add cordova-plugin-file

*/



class FileHelper{

    constructor(){
    }
    
    cordovaAvaible(){
        if(typeof cordova !== 'undefined'){
            return true;
        }
        else return false;
    }

    //FUNZIONA su android
    //Apre il file nameFile nella cartella www e ritorna una stringa come sua rappresentazione 
    async read_www_File({nameFile, success}){
        let ris;
        try{
            let advise = 'Warning or Error'; //se succede qualcosa di imprevisto lo comunico
            var adress = '';
            if(this.cordovaAvaible()){
                if(cordova.platformId == "android"){
                    ris = new Promise( (resolve, reject) => {
                        adress = cordova.file.applicationDirectory + 'www/'+ nameFile;
                        window.resolveLocalFileSystemURL(adress, 
                            (fileEntry) => {
                                fileEntry.file(
                                    (file) => {
                                        var reader = new FileReader();
                                        reader.onloadend = function () {
                                            if(typeof success == 'function')
                                                success(this.result);
                                            resolve(this.result);
                                        };
                                        reader.readAsText(file);
                                        },
                                    (e) => {
                                        reject("Error to get file\n\t"+e)
                                    }
                                );
                            }, 
                            (e) => {
                                reject("Error to resolve url of "+ nameFile +"\n\t"+e+": "+e.code+"\n\t\t" + this.errDecode(e.code)); 
                            });
                    });
                }
                else if(cordova.platformId == "browser"){ //read_www_File in localHost://www
                    ris = new Promise( (resolve, reject) => {
                    $.ajax(
                        {
                            dataType: "text",
                            url: 'www/'+ nameFile,
                            error: function (xhr,status,error){
                                reject("Error to get Json file: "+ adress +" \n\t"+error);
                            },success: function(result){
                                if(typeof success == 'function')
                                    success(result);                                
                                resolve(result);
                            }
                        });
                    });
                }
                else{ 
                    ris = "Lettura da file ancora non supportato, device: " + cordova.platformId;
                    console.error(ris);
                }
            }
            else{ 
                success("error open "+nameFile+":\n\t"+"Cordova not activated, maybe use the browser without activate cordova");
            }
        }
        catch(e){
            console.error(e);
            console.error("Maybe you have not installed cordova plugin file:\n cordova plugin add cordova-plugin-file ");
        }
    return await ris;
    }

    async read_appStorage_File( {nameFile, success} ){
        let ris = "";
        try{
            let advise = 'Warning or Error'; //se succede qualcosa di imprevisto lo comunico
            if(this.cordovaAvaible()){
                if(cordova.platformId == "android"){ //read_appStorage_File in cordova.file.applicationStorageDirectory
                    ris = new Promise( (resolve, reject) => {
                        //apro la directory
                        window.resolveLocalFileSystemURL(
                            cordova.file.applicationStorageDirectory, 
                            (dirEntry) => {
                                //apro il file con getFile( nameFile, options, success, failure)
                                dirEntry.getFile( nameFile, {},
                                    (fileEntry) => {
                                        fileEntry.file(
                                            (file) => {
                                                var reader = new FileReader();
                                                reader.onloadend = function () {
                                                    if(typeof success == 'function')
                                                        success(this.result);
                                                    resolve(this.result);
                                                };
                                                reader.readAsText(file);
                                                },
                                            (e) => {
                                                reject("Error to get file\n\t"+e)
                                            }
                                        );
                                    }, 
                                    
                                    (e) => {

                                        reject("Error to resolve url of "+nameFile+"\n\t"+e+": "+e.code+"\n\t\t"+this.errDecode(e.code)); 
                                    }
                                );
                            }
                        );
                    });
                }
                else if(cordova.platformId == "browser"){ //read_appStorage_File in PERSISTENT
                    ris = new Promise((resolve,reject)=>{
                        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, 
                            (fs) => {
                                fs.root.getFile(nameFile, { create: false, exclusive: false }, 
                                    (fileEntry) => { 
                                        fileEntry.file(
                                            (file) => {
                                                var reader = new FileReader();
                                                reader.onloadend = function () {
                                                    setTimeout(100);
                                                    if(typeof success == 'function')
                                                        success(this.result);
                                                    resolve(this.result);
                                                };
                                                reader.readAsText(file);
                                                },
                                            (e) => {
                                                reject("Error to get file\n\t"+e);
                                            }
                                        );
                                    }, 
                                    (e) => {reject(e)});
                            },

                            (error)=> {
                                reject(error);
                            }
                        );
                    });
                }
                else{
                    console.error("Lettura da file ancora non supportato, device: " + cordova.platformId);
                    advise = "Lettura da file ancora non supportato";
                    error(JSON.stringify(error));
                    ris = ""; 
                }
            }
    
            else{
                advise = "Cordova not activated, maybe use the browser without activate cordova";
                ris ="error open "+nameFile+":\n\t"+advise;
            }
        }
        catch(e){
            console.error("Error to file: "+nameFile+"\n\t"+ e);
        }
        return ris;
    }

    //return promise=> pending, 1=> ok, 'string' => error
    async write_appStorage_File( {nameFile, dataObj, boolCreate=false, success, error} ){
        let response;
        try{
            let advise = 'Warning or Error'; //se succede qualcosa di imprevisto lo comunico
            var adress = '';
            if(this.cordovaAvaible()){
                if(cordova.platformId == "android"){ //write_appStorage_File in cordova.file.applicationStorageDirectory
                    response = new Promise( (resolve, reject) => {
                        window.resolveLocalFileSystemURL(cordova.file.applicationStorageDirectory,
                                (dirEntry) => {
                                    dirEntry.getFile(nameFile,{create: boolCreate, exclusive: false}, 
                                        (fileEntry) => {
                                            // Create a FileWriter object for our FileEntry (nameFile).
                                            fileEntry.createWriter(function (fileWriter) {
                                                fileWriter.onwriteend = function() {
                                                    resolve(1);
                                                };
                                                fileWriter.onerror = function (e) {
                                                    reject("Failed file write: " + e.toString());
                                                };
                                                if (!dataObj) {// If data object is not passed in, create a new Blob instead.
                                                    dataObj = new Blob(['""'], { type: 'text/plain' });
                                                }
                                                else if(typeof dataObj == 'string'){
                                                    dataObj = new Blob([dataObj.trim()], { type: 'text/plain' });
                                                }
                                                fileWriter.write(dataObj);
                                            });
                                        }, 
                                        (e) => {
                                            reject("Error to resolve url of "+nameFile+"\n\t"+e+": "+e.code+"\n\t\t"+this.errDecode(e.code)); 
                                        }
                                    );
                                }
                        );}
                    );
                }
                else if(cordova.platformId == "browser"){ //write_appStorage_File in PERSISTENT
                    //critical region with promise
                    response = new Promise((resolve,reject)=>{
                        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, 
                            (fs) => {
                                fs.root.getFile(nameFile, { create: boolCreate, exclusive: false }, 
                                    (fileEntry) => { 
                                        fileEntry.createWriter(function (fileWriter) {
                                            fileWriter.onwriteend = function() {
                                                if (fileWriter.length === 0 && dataObj.size > 0) { //se succede questo ho dei problemi
                                                    //fileWriter has been reset, write file
                                                    fileWriter.write(dataObj);
                                                } else {
                                                    window.setTimeout(function(){
                                                        resolve(1);//use callback or resolve promise
                                                    },500)
                                                    
                                                    
                                                }
                                                //resolve(1); //fatto rispondo positivo alla promessa
                                            };
                                    
                                            fileWriter.onerror = function (e) {
                                                reject(e); //ho fallito, rigetto risponendo con errore alla promessa
                                            };

                                            if (!dataObj) {// If data object is not passed in, create a new Blob instead.
                                                dataObj = new Blob([''], { type: 'text/plain' });
                                            }
                                            else if(typeof dataObj == 'string'){
                                                dataObj.trim();
                                                dataObj = new Blob([dataObj], {});
                                            }
                                            else if(typeof dataObj == 'object'){
                                                //inizio conversione
                                                dataObj = JSON.stringify(dataObj).trim();
                                                dataObj = new Blob([dataObj], { type: 'application/json' });
                                            }

                                            window.setTimeout(function(){
                                                fileWriter.truncate(0);
                                            },500);
                                        });
                                    }, 
                                    (e) => console.error(e));
                            },
                            (error)=> console.error(error));
                    });
                    //end of critical
                }
                else{
                    console.error("Lettura da file ancora non supportato, device: " + cordova.platformId);
                    advise = "Lettura da file ancora non supportato";
                    console.error(JSON.stringify(error)); 
                    response = "Lettura da file ancora non supportato, device: " + cordova.platformId;
                }
            }
    
            else{
                advise = "Cordova not activated, maybe use the browser without activate cordova";
                response = "error open "+nameFile+":\n\t"+advise;
            }
    
        }
        catch(e){
            response = e;
        }
        return response;
    }



    //ritorna true se esiste il file, false se non esiste nella directory applicationStorage
    async existingFile_appStorage(nameFile){
        let ris = false;
        if(this.cordovaAvaible()) {
            if(cordova.platformId == "android"){ //existingFile_appStorage in cordova.file.applicationStorageDirectory
                ris = new Promise( (resolve, reject) => {
                let adressDir = cordova.file.applicationStorageDirectory;
                window.resolveLocalFileSystemURL(adressDir+'/'+nameFile,
                    () => {
                        resolve(true) //found, is succcess, exist is true
                    },
                    
                    (e) => {
                        if(e.code == 1)//not found file, is success, exist is false
                            {
                            resolve(false);
                            }
                        else //for other error
                            reject("Error to resolve url of "+nameFile+"\n\t"+e+": "+e.code+"\n\t\t"+this.errDecode(e.code)); 
                        }
                    );
                });
            } else if(cordova.platformId == "browser"){ //existingFile_appStorage in PERSISTENT
                //inizio regione critica
                ris = new Promise((resolve,reject)=>{
                    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, 
                        async (fs) => { //success fs function
                            fs.root.getFile(nameFile, { create: false, exclusive: false }, 
                                async () => { //found file function
                                    resolve(true); //ho trovato un fileEntry, quindi c'è il file
                                }, 
                                async () => { //not found file function 
                                    resolve(false); //non ho trovato il file entry quindi o non c'è o c'è qualcos'altro
                                });
                        },
                         
                        async (error)=> {reject(error)} //error fs function
                    );
                });

                // fine regione critica
/*                 }); */              
            } 
            else{
                console.log("device not supported");
                return false;
            }
        }
        return ris;
    }

    errDecode(number){
        switch (number) {
            case 1:
                return 'NOT_FOUND_ERR';
            case 2:
                return 'SECURITY_ERR';
            case 3:
                return 'ABORT_ERR';
            case 4:
                return 'NOT_READABLE_ERR';
            case 5:
                return 'ENCODING_ERR';
            case 6:
                return 'NO_MODIFICATION_ALLOWED_ERR';
            case 7:
                return 'INVALID_STATE_ERR';
            case 8:
                return 	'SYNTAX_ERR';
            case 9:
                return 'INVALID_MODIFICATION_ERR';
            case 10:
                return 'QUOTA_EXCEEDED_ERR';
            case 11:
                return 'TYPE_MISMATCH_ERR';
            case 12:
                return 'PATH_EXISTS_ERR';
            default:
                return "UKNOWN";
        }
    }

    async readPersistentFile({nameFile, success, error}){
        let p1;
        if(cordova.platformId == "browser"){ //existingFile_appStorage
            p1 = new Promise( (resolve, reject) => {
                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, 
                    (fs) => {
                        fs.root.getFile(nameFile, { create: false, exclusive: false }, 
                            (fileEntry) => { 
                                fileEntry.file(
                                    (file) => {
                                        var reader = new FileReader();
                                        reader.onloadend = function () {
                                            console.log("Contenuto File:\n\t "+ this.result);
                                            resolve(this.result);
                                        };
                                        reader.readAsText(file);
                                        },
                                    (e) => {
                                        console.error("Error to get file\n\t"+e);
                                        reject(e);
                                    }
                                );
                            }, 
                            (e) => resolve(false));
                    },
                     
                    (error)=> reject(error));
            });              
        } else{
            console.log("device not supported");
            return false;
        }

        await p1.then( 
            (value) => {
                if(!typeof success == 'undefined') 
                    success(value); // Success!
            }, 
            (reason) => {
                if(!typeof error == 'undefined')
                    error(reason); //Error!
            } 
        );

    }

    async readDataDirectory(fileName){
        await Promise.resolve();
        await this.mutex.lock();
        //critical region
        let p1 = new Promise( (resolve, reject) => {
            let adressDir = cordova.file.applicationStorageDirectory;
            window.resolveLocalFileSystemURL(adressDir+'/'+fileName,
                (fileEntry) => {
                    fileEntry.file(
                        (file) => {
                            var reader = new FileReader();
                            reader.onloadend = function () {
                                resolve(this.result);
                            };
                            reader.readAsText(file);
                            },
                        (e) => {
                            reject("Error to get file\n\t"+e)
                            }
                    );
                },
                (e) => reject(e) 
            );
        });
        
        await p1.then( 
            (value) => {
                return value; // Success!
            }, 
            (reason) => {
                return reason; // Error! 
            } 
        );
        
    }
}

function fileRead(fileEntry){
    fileEntry.file(
        (file) => {
            var reader = new FileReader();
            reader.onloadend = function () {
                console.log("Contenuto File:\n\t "+ this.result);
            };
            reader.readAsText(file);
            },
        (e) => {
            console.error("Error to get file\n\t"+e)
        }
    );
}

/* Function di on */
function onErrorLoadFs(e){
    console.error("Cannot load file sistem: "+e);
}

function onErrorCreateFile(e){
    console.error("Cannot Create File: "+ e);
}

function onErrorReadFile(e){
    console.error("Cannot Read File: " + e);
}

function displayFileData(data){
    console.log(data);
}


class Mutex {
    constructor() {
        var self = this; // still unsure about how "this" is captured
        var mtx = new Promise(t => t()); // fulfilled promise ≡ unlocked mutex
        this.lock = async function () {
            await mtx;
            mtx = new Promise(t => {
                self.unlock = () => t();
            });
        };
    }
}

//
/* 
app.myFileHelper.write_appStorage_File({nameFile: "cavia.json", dataObj: "prova", boolCreate: true})

app.myFileHelper.read_appStorage_File( {nameFile: "cavia.json", callbackAsync: (o) => console.log(o) } );

*/