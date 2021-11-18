/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var app = {
    
    // Application Constructor
    initialize: function() {
        this.phoneOrientation = 'undefined';
        this.myFileHelper = new FileHelper();
        this.myMenu = new ProductsManager();
        this.myReceipts = new ReceiptsManager();
        this.actualMenu = "";
        this.preferences = "";
        //operazioni di Binding
        this.bindObject();

        //Operazioni di device Ready se cordova non è operativo
        if(typeof cordova === 'undefined'){
            $(document).on('pageinit', function() {
                app.deviceReady();
                $(document).off('pageinit');
            });
        }
        
        //operazioni per gestire device ready
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: async function() {
        this.receivedEvent('deviceready');
        this.showLoading();
        await this.firstSetup();
        await this.deviceReady(); //load step of deviceReady
        this.hideLoading();
    },

    firstSetup: async function(reset=false) {
        //Seeing presence
        let presencePref = await this.myFileHelper.existingFile_appStorage("Preferences.json");
        let presenceReceipts = await this.myFileHelper.existingFile_appStorage("Receipts.json");
        let presenceMenus = await this.myFileHelper.existingFile_appStorage("Menus.json"); 

        if( (!presencePref || reset) ){ //se non è presente oppure c'è la reset mode allora sovrascrivi
            //reads the preferences of www adress and save into appStorage
            let dataPref =await this.myFileHelper.read_www_File({nameFile: "Preferences.json"});

            await this.myFileHelper.write_appStorage_File( 
                {
                    nameFile: "Preferences.json", 
                    dataObj: dataPref, //dataPref 
                    boolCreate: true,
                    error: (e)=>console.error(e)
                } 
            ); 
        }
        //If not exist old Receipt save, create new Receipts default File
        if( (!presenceReceipts || reset) ){
            //create Receipts file
            await this.myFileHelper.write_appStorage_File( 
                {
                    nameFile:"Receipts.json", 
                    dataObj: "[]", 
                    boolCreate: true, 
                    error: (e)=>console.error(e)
                });
        }
        //If not exist old Menus save, create new Menus default File
        if( (!presenceMenus || reset) ){
            let dataObj = await this.myFileHelper.read_www_File({nameFile: "Menus.json"});
            await this.myFileHelper.write_appStorage_File( 
                {
                    nameFile: "Menus.json", 
                    dataObj: dataObj, 
                    boolCreate: true, 
                    error: (e)=>console.error(e)
                });
        }
        
        //load
        await this.myFileHelper.read_www_File({nameFile: "ChangeLog.json", success: this.compileJsonChangelog});

        let prefJsonString = await this.myFileHelper.read_appStorage_File({nameFile: "Preferences.json"});
        this.setSetting(prefJsonString);

        await this.myFileHelper.read_appStorage_File({nameFile: "Receipts.json", success: (jsonString)=>{
            let receipt = JSON.parse(jsonString.trim());
            app.myReceipts.load(receipt, app.actualMenu);
            }
        });

        await this.myFileHelper.read_appStorage_File({nameFile: "Menus.json", success: (jsonString)=>{
            app.myMenu.loadMenus(jsonString);
            app.compileCategory(app.myMenu.getCategories(app.actualMenu));
            app.compileProducts(app.myMenu.getProducts(app.actualMenu));
            }
        });
        if($.mobile.activePage.attr("id") != "homePage")
            $.mobile.navigate("#homePage");
    },

    deviceReady: async function(){
        $(".selectedMenu").text('Menu selezionato: '+app.actualMenu);
        //operazioni di orientamento oggetti
        this.compileSetting();
        this.resize();
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        switch (id) {
            case 'deviceready':
                //Operation of update dom first execute deviceReady
                break;
            default:
                console.log('Received Event: ' + id);
                break;
        }
    },

    bindObject: function(){
        /* Orientation listener */
        $(window).on( "orientationchange",  (event) =>{
            if(event.orientation == 'portrait')
                this.resize("portrait");
            else if(event.orientation == 'landscape')
                this.resize("landscape");
            });

        $( "#scPage" ).on( "pagecreate", ()=>{ //acoltatore che esegue il metodo quando la pagina scPage viene creata
            this.compileReceipt(new Array(0,new Array())); //compilo un receipt vuoto (un prezzo vuoto, un vettore vuoto)
        });
            

        /* Binding infoPage with anonimous function (arrow operation) */
        $(".btn-changeLog") .on('click',    ()=>{$("#creditsContent").hide();   $("#changelogContent").show();});
        $(".btn-credits")   .on('click',    ()=>{$("#changelogContent").hide(); $("#creditsContent").show();});

        $(".btn-backOptProd").on('click', ()=>{});
        $(".B1").on('click',   ()=>
        {
            $("#labelSetting").removeClass("visibilityfor5s");
            $("#labelSetting").addClass("nonVisibility");
            //$("#labelSetting").css('visibility','none');
        });
        /* Button of main page */
        $(".btn-menu")      .bind('taphold', ()=>{this.changeShowDescr("menu")});
        $(".btn-sc")        .bind('taphold', ()=>{this.changeShowDescr("sc")});
        $(".btn-an")        .bind('taphold', ()=>{this.changeShowDescr("an")});
        /* Button and element of setting page */
        $(".btn-saveSetting").on('click',   ()=>
            {
                $("#labelSetting").removeClass("visibilityfor5s");
                app.showLoading();
                app.hideLoading();
                $("#labelSetting").removeClass("nonVisibility");
                $("#labelSetting").addClass("visibilityfor5s");
        });
        
        $(".btn-askHardReset").on('click',   ()=>{
/*          app.showLoading();
            app.firstSetup(true);
            app.hideLoading(); */
        });
            
    },

    changeShowDescr: function(mod){
        navigator.vibrate(100);
        switch (mod) {
            case "menu":
                $('.customDesc').text(DESC_MENU+"");
                break;
            case "sc":
                $('.customDesc').text(DESC_SC+"");
                break;
            case "an":
                $('.customDesc').text(DESC_AN+"");
            break;
        
            default: $('.customDesc').text(DESC_DEF+"");
                break;
        }
    },

    setSetting: function(jsonString){
        this.preferences = JSON.parse(jsonString.trim());
        this.actualMenu = this.preferences.menuPref;
    },

    compileSetting: function(){
        $(".panelSlct-Menu>*").remove().trigger("refresh");
        let panel = $(".panelSlct-Menu");
        let selectMenuPre = $('<select class="slct-actualMenu" name="select-menu" id="select-menu"></select>');
        let menu = app.myMenu.getMenus();
        if(!Array.isArray(menu))
            console.error(menu);
        else
            menu.forEach(element => {
                if(element.name == this.actualMenu) 
                    selectMenuPre.append('<option value="'+element.id+'" selected="selected" >'+element.name+' </option>');
                else 
                    selectMenuPre.append('<option value="'+element.id+'"> '+element.name+' </option>');
        });
        panel.append('<label style="font-size: 10pt" for="select-menu">Menu impostato:</label>').trigger("create");
        panel.append(selectMenuPre).trigger("create");
    },

    compileJsonChangelog: function(jsonString){
        try{
            let log = JSON.parse(jsonString.trim());
            let divChange = $("#changelogContent");
            let divLayer = $("<div class='ui-content' style='min-height: unset; overflow-y:auto; font-family:courier;'> </div>");
            let ver ='';
            if(Array.isArray(log)){
                log.forEach(element => {
                    ver = element.Ver;
                    let divElement = $("<div>");
                    let ul = $("<ul>");
                    (element.lista).forEach(i => {
                        let riga = $("<li> "+ i +"</li>");
                        ul.append(riga);
                        });
                    divElement.append($("<Strong> "+ element.data +" VER: "+ element.Ver +", Ore: "+element.ore+'</strong>'));
                    divElement.append(ul);
                    divLayer.append(divElement);
                    });
                }
            else{
                divLayer.append($("<Strong> "+ log +"</strong>"));
            }
            divChange.append(divLayer).trigger("create");
            $('.btn-ver').text('Versione: '+ver);
            divChange.show();
            }catch(e){
            console.error(e);
        }
    },

    compileCategory: function (categories) {
        if(!Array.isArray(categories)){
            console.error("Error: param categories isn't array:\n\t"+categories);
        } 
        else{
            $(".panelCategory>*").remove();
            var divCategory = $(".panelCategory");
            let tableCategory = $('<table class="controlCategory"></table>');
            let trCategory = $('<tr></tr>');
            let liCategory = $("<th> <a data-role='button'>"+ "Mostra Tutto" +"</a></th>");
            liCategory.on("click", () =>{ $("#filterProduct").val(""); $("#filterProduct").trigger("change");});
            trCategory.append(liCategory);
            
            categories.forEach(element => {
                liCategory = $("<th> <a data-role='button'>"+ element +"</a></th>");
                liCategory.on("click", () =>{ $("#filterProduct").val(element); $("#filterProduct").trigger("change");});
                trCategory.append(liCategory);
            });
            tableCategory.append(trCategory);
            divCategory.append(tableCategory).trigger("create");
        }
    },

    compileProducts: function(products){
        try {
            if(!Array.isArray(products)){
                console.error("Error: param products isn't array:\n\t"+products);
            } 
            else{
                var container = $(".listProduct");
                $(".listProduct>*").remove();
                products.forEach(element => {
                    let li =$(  '<li data-filtertext="'+element.category+' '+element.name+'">'+
                                    '<a>'+ element.name+'</a>'+ 
                                '</li>');
                    let plusButton = $('<a data-rel="popup" data-position-to="window" data-transition="pop">Add</a>');
                    //aggiunta di prodotti senza ingredienti (atomici)
                    if(element.ingredients.length == 0){
                        plusButton.on('click', () =>{
                            let newProduct = {'name': element.name, 'category': element.category, 'price': element.price, 'ingredients': []};
                            this.myReceipts.addProduct(newProduct);
                            this.compileReceipt(this.myReceipts.getActualReceipt());
                        });
                    }
                    else{
                        plusButton.on('click', ()=>{
                            //inserisco l'elemento nel pannello delle scelte di inserimento
                            this.compileChoice("new", element);
                            $("#popupDialog").popup("open");
                        });
                    }
                    li.append(plusButton);
                    container.append(li).trigger("create");
                });
                $("#filterProduct").trigger("change");
            }
            
        } catch (error) {
            console.error(error);
        }
    },

    //Compila il pannello delle scelte della pupopDialog modificandogli l'aspetto
    compileChoice: function(tag,element){
        let name = element.name;
        let choice = element.ingredients; // metto gli ingredienti in choice
        $(".nameProductuPop").text(name);
        let containerChoice = $(".choiceBox");
        $(".choiceBox>*").remove();
        let formChoice = $("<div style='padding: 5px'> </div>");
        let fieldSet = $("<fieldset data-role='controlgroup' data-iconpos='right'> </fieldset>")
        let buttonChoice = $('<div data-role="controlgroup" data-type="horizontal" data-mini="true" ></div>')
        let addCustomChoice = $('<a href class="addCustomChoice ui-btn ui-corner-all ui-btn-icon-notext ui-icon-plus" data-role="button"></a>');
        let deleteCustomChoice = $('<a href class="deleteCustomChoice ui-btn ui-corner-all ui-icon-minus ui-btn-icon-notext" data-role="button"></a>');
        buttonChoice.append(addCustomChoice);
        buttonChoice.append(deleteCustomChoice);
        choice.forEach(ingredient => { //metto gli ingredienti possibili nelle checkBox
            let checkIngredient = $('<label> <input class="checkChoice" type="checkbox" name="'+ingredient+'"> '+ingredient+' </label>');
            fieldSet.append(checkIngredient);
        });
        formChoice.append(fieldSet);
        formChoice.append(buttonChoice);
        containerChoice.append(formChoice).trigger('create');
        $('.addCustomChoice').off();
        $('.addCustomChoice').on('click', ()=>{
            fieldSet.append('<input style="direction: ltr;" class="customBox checkChoice" type="text" value=""/>').trigger('create');
        });
        $('.deleteCustomChoice').off();
        $('.deleteCustomChoice').on('click', ()=>{
            $(".customBox").last().remove();
        });
        buttonChoice.css("display", "contents");
        if(tag == 'new'){//il pannello dovrà aggiungere l'elemento al receipt
            console.log("proposta di aggiungere: "+element.name+"\n\t"+element.ingredients.toString());
            $(".btn-confOptProd").text('Aggiungi'); //modifico il testo del bottone
            $(".btn-confOptProd").off(); //gli scollego gli eventHandler
            $(".btn-confOptProd").on('click', () =>{
                newProduct = Object.assign({}, element); //clono l'elemento
                let trueIngredients = new Array();// preparo un vettore che saranno i veri ingredienti che vorrà l'utente
                //prendo dalle check box le scelte fatte dall'utente e le metto in trueIngredients
                ($(".checkChoice").toArray()).forEach(check => { 
                    if(check.checked)
                        trueIngredients.push(check.name);
                    else if(check.value.trim() != "" && check.value != "on" )
                        trueIngredients.push((check.value.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;"))); //sanitizzo l'input
                });
                let qt = $('#qtSliderDialog')[0].value;
                if(trueIngredients.length == 0){
                    trueIngredients.push("Nessuna Scelta")
                }
                newProduct.ingredients = trueIngredients;
                this.myReceipts.addProduct(newProduct, parseInt(qt));
                $("#popupDialog").popup("close");
                this.compileReceipt(this.myReceipts.getActualReceipt());
                console.log("aggiungo:\n" + newProduct.name + "\ncon scelte dell'utente:\n"+ trueIngredients);
            });
        }

        /* $("#popupDialog > div.ui-grid-a").css("heigth","175px"); */
    },

    //compila lo scontrino mantenendo lo scroll
    compileReceipt: function(receipt){
        let totalPrice = receipt[0];
        receipt = receipt[1];
        let previousScroll_Landscape = $(".receiptBox-landscape").scrollTop();
        let previousScroll_Portrait = $(".receiptBox-portrait").scrollTop();

        let idProdBtns = new Array();
        let container = $(".listReceipt");
        $(".listReceipt>*").remove();
        /* let fieldSet = $('<fieldset class="listReceipt"></fieldset>'); */
        //CATEGORY
        receipt.forEach(category => {
            let categoryDIV = $('<div data-role="collapsible" data-collapsed="false" data-collapsed-icon="carat-d" data-expanded-icon="carat-u">');
            categoryDIV.append("<h4>"+ category.nameCategory +"<h4>");
            listProducts = $('<ul class="listReceipt" data-role="listview" data-inset="true"></ul>');
            
            categoryDIV.append(listProducts);
            let positionOfProd = 0; //la calcolo ad ogni ciclo di for each
            //PRODUCT
            category.products.forEach(product => {
                let stringDivIngredients = "";
                //Scansione scelte/ingredienti se ci sono
                if(Array.isArray(product.ingredients) && product.ingredients.length>0){
                    stringDivIngredients = '<ul class=ingredientsBox>';
                    product.ingredients.forEach(ingredient => {
                        stringDivIngredients += '<li>'+ ingredient +'</li>'; //aggiungo gli ingredienti come stringhe
                    });
                    stringDivIngredients += "</ul>"; //chiudo la stringa del div ingrediente
                }
                else stringDivIngredients = '';

                //gestione id dei pulsanti
                let id_prod = category.nameCategory + "-" + positionOfProd ; 
                idProdBtns.push(id_prod);
                listProducts.append(
                    '<li>'+
                        '<span class="ui-li-count qt">'+'Qt: '+ product.qt +'</span>'+

                            '<div class=ui-grid-prod>'+
                                '<div class=ui-block-a>'+
                                    '<a data-role="button" data-icon="edit"     data-iconpos="notext" data-inline="true" class="M_'+id_prod+'               ">  Edit    </a>'+
                                    '<a data-role="button" data-icon="delete"   data-iconpos="notext" data-inline="true" class="D_'+id_prod+' btnDelProd    ">  Delete  </a>'+
                                '</div>'+
                                '<label class="ui-block-b productName"><b>'+ product.name +'</b></label>'+ 
                            '<div>'+
                            
                            '<div style="clear:left">'+
                                stringDivIngredients +
                                '<span class="ui-body-inherit price">'+ product.price +'€ </span>'+
                            '</div>'+
                    '</li>'
                ).trigger("create");
                

                //APPEND PRODUCT TO LIST
                
                //
                positionOfProd++;
            });
            //APPEND CAT TO CONTAINER
            container.append(categoryDIV).trigger("create");

            //una volta creato tutto collego i bottoni del. e mod. di ogni prodotto
            idProdBtns.forEach(id => {
                let cat_name = id.split('-');
                let category = cat_name[0];
                let posProd = cat_name[1];
                $('.'+"M_"+id).off();
                $("."+"D_"+id).off();

                $('.'+"M_"+id).on('click', ()=>{
                    console.log("Modifico prodotto numero: "+posProd+" della categoria: " + category);
                });
                
                $("."+"D_"+id).on('click', ()=>{
                    this.myReceipts.deleteSingleProduct(category,posProd);
                    //aggiorno lo scontrino
                    this.compileReceipt(this.myReceipts.getActualReceipt());
                });
            });
        });
        //Compilo la navbar sotto lo scontrino
        $('.underReceiptBar>*').remove();
        $('.underReceiptBar').append('<div class="receiptPrice"> Prezzo: '+ totalPrice+'€').trigger("create");
        $('.underReceiptBar').append(
            '<div data-role="controlgroup" data-type="horizontal" data-mini="true" class="control-btn-Receipt">'+
                '<a class="goSummary" data-role="button"> Conferma </a> '+
            '</div>'
        ).trigger("create");
        $('.goSummary').on('click', ()=>{
            $('.userMoney').val(""); //resetto
            $("#popupSummary").popup("open");
        });
        $('.receiptMoney').val(totalPrice);
        
        if( totalPrice <= 0 ){
            $(".payPrintReceipt").button('disable');
        }

        $('.userMoney').off();
        $('.userMoney').on('keyup',()=>{
            let receiptMoney = Number($('.receiptMoney').val()).toFixed(2);
            let userMoney = Number($('.userMoney').val()).toFixed(2);
            let difference =  Number(userMoney - receiptMoney).toFixed(2);
            if(difference >= 0 && parseInt(receiptMoney) > 0 ){
                $(".differenceMoney").val(difference);
                $(".payPrintReceipt").button('enable');
            }
            else {
                $(".differenceMoney").val("");
                $(".payPrintReceipt").button('disable');
            }
            
        });
//_--------------------------------------------------------------------------------
        //ripristino lo scroll
        $(".receiptBox-landscape").scrollTop(Math.trunc(previousScroll_Landscape));
        $(".receiptBox-portrait").scrollTop(Math.trunc(previousScroll_Portrait));

        $(".ui-collapsible-content.ui-body-inherit").css("margin-top", "-22px");
    },

    filterProduct: function (text) {  
        $("#filterProduct").val(text);
        $("#filterProduct").trigger("change");
    },

    goPageSc: function(){
        app.compileCategory(app.myMenu.getCategories());
        app.compileProducts(app.myMenu.getProducts());
        $.mobile.changePage("#scPage");
    },

    getWindowsH(){
        return $(window).height();
    },

    getPageH(){
        return $.mobile.activePage[0].offsetHeight;
    },

    getHeaderH(){
        let idPage = $.mobile.activePage.attr("id");
        let header = $("#"+idPage+">div[data-role='header']");
        let height=0;
        if(typeof header != 'undefined'&& header.length>0)
            height = header[0].offsetHeight;
        else console.error('WARNING in '+idPage+' header');
        return height;
    },


    getContentH(){
        let idPage = $.mobile.activePage.attr("id");
        let content = $("#"+idPage+">div[data-role='content']");
        let height = 0;
        if(typeof content != 'undefined' && content.length>0)
            height = content[0].offsetHeight;
        else console.error('WARNING in'+idPage+' Content');

        return height;
    },

    getFooterH(){
        let idPage = $.mobile.activePage.attr("id");
        let footer = $("#"+idPage+">div[data-role='footer']");
        let heigth=0;
        if(typeof footer != 'undefined'&& footer.length>0)
            heigth = footer[0].offsetHeight;
        else console.error('WARNING in '+idPage+' Footer');

        return heigth;
    },

    resize(status=''){
/*         let contentH = app.getWindowsH() - (app.getHeaderH());
        $("div[data-role='content']").css('height', contentH ); 
        $("div[data-role='content']").css('max-height', contentH ); */
        try {
            if(status == ''){
                if(window.orientation == 0){ //portrait
                    status = "portrait";
                } 
                else if(window.orientation == 90){  
                    status = "landscape";
                }
                else status = "portrait";
            
            }
            
            if (status == 'landscape'){
                $(".titleDesc").addClass("titleDesc-landscape");
                $(".titleDesc").removeClass("titleDesc-portrait");
    
                $(".divDescr").addClass("divDescr-landscape");
                $(".divDescr").removeClass("divDescr-portrait");
    
                $(".blankSpace").addClass("blankSpace-landscape");
                $(".blankSpace").removeClass("blankSpace-portrait");
                
                $(".control-portrait").hide();
                $(".control-landscape").show();

                $(".optionProduct-portrait").hide();
                $(".optionProduct-landscape").show();

                $(".divReceipt-portrait").hide();
                $(".divReceipt-landscape").show();

                $(".popupDialog").addClass("popupDialog-landscape");
                $(".popupDialog").removeClass("popupDialog-portrait");

                $(".cntrBtn-choice").removeClass("cntrBtn-choice-portrait");
                $(".cntrBtn-choice").addClass("cntrBtn-choice-landscape");

/*                 $(".receiptBox").removeClass("receiptBox-portrait");
                $(".receiptBox").addClass("receiptBox-landscape"); */
            }
            else if (status == 'portrait'){
                $(".titleDesc").removeClass("titleDesc-landscape");
                $(".titleDesc").addClass("titleDesc-portrait");
    
                $(".divDescr").removeClass("divDescr-landscape");
                $(".divDescr").addClass("divDescr-portrait");
    
                $(".blankSpace").removeClass("blankSpace-landscape");
                $(".blankSpace").addClass("blankSpace-portrait");
                
                $(".control-landscape").hide();
                $(".control-portrait").show();

                $(".optionProduct-landscape").hide();
                $(".optionProduct-portrait").show();

                $(".divReceipt-landscape").hide();
                $(".divReceipt-portrait").show();

                $(".popupDialog").removeClass("popupDialog-landscape");
                $(".popupDialog").addClass("popupDialog-portrait");

                $(".cntrBtn-choice").removeClass("cntrBtn-choice-landscape");
                $(".cntrBtn-choice").addClass("cntrBtn-choice-portrait");

/*                 $(".receiptBox").removeClass("receiptBox-landscape");
                $(".receiptBox").addClass("receiptBox-portrait"); */
            }
            this.phoneOrientation = status;
            
        } catch (error) {
            console.error(error);
        }
    },

    showLoading(){
        var $this = $( this ),
        theme = $this.jqmData( "theme" ) || $.mobile.loader.prototype.options.theme,
        msgText = $this.jqmData( "msgtext" ) || $.mobile.loader.prototype.options.text,
        textVisible = $this.jqmData( "textvisible" ) || $.mobile.loader.prototype.options.textVisible,
        textonly = !!$this.jqmData( "textonly" );
        html = $this.jqmData( "html" ) || "";
        $.mobile.loading( "show", {
            text: msgText,
            textVisible: textVisible,
            theme: theme,
            textonly: textonly,
            html: html
        });
    },

    hideLoading(){
        $.mobile.loading( "hide" );
    },

    showFooter(){
        $(".footer-wrapper").show();
    },

    hideFooter(){
        $(".footer-wrapper").hide();
    }


};


app.initialize();

/* $(document).ready(function(){
    var toppos=($(window).height()/2) - ($(".persistentz").height()/2);
    var leftpos=($(window).width()/2) - ($(".persistentz").width()/2);
    $(".persistentz").css("top", toppos).css("left",leftpos);
}); */

/* criticalRegion: async function () {
    await this.myFileHelper.read_www_File("ChangeLog.json", this.compileJsonChangelog);
    return "done!";
  }, */