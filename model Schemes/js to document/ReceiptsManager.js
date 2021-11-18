class Receipt{
    
    constructor(menu){
        this.menu = menu;
        this.visualRecepit = [];
        this.totalPrice = 0;
    }

    addProduct(element, qt=1){
        /* let elements = new Product (name,category,price,ingredients); */
        /* let element = {'name': name, 'category': category, 'price': price, 'ingredients': ingredients}; */
        element.qt = qt;
        let categoryKey = element.category;
        //dato il nome della categoria dell'elemento cerco la sua lista
        let list = this.visualRecepit.find( (element)=>{ if (element.nameCategory == categoryKey) return element}); 
        
        if(typeof list != 'undefined'){//se trovo la lista
            //accorpo quelli uguali
            let nameProductKey = element.name;
            let ingredientProductKey = element.ingredients;
            let sameProduct = list.products.find( (productJ)=>{ 
                if (productJ.name == nameProductKey)
                    if(ingredientProductKey.toString() === productJ.ingredients.toString()){ //vedo se le loro rappresentazioni in stringa dei loro ingredienti sono uguali, se lo sono allora è lo stesso prodotto
                        return productJ;
                    }
            });
            if(typeof sameProduct != "undefined") //c'è lo stesso prodotto, modifico la quantità
                sameProduct.qt += qt;
            else //se non c'è lo stesso prodotto allora lo aggiungo direttamente    
                list.products.push(element);
            // modifico i numberOfProducts della categoria dopo aver aggiunto i/il prodotti/o
            list.numberOfProducts += qt;            
        }
        else{//se non la trovo la creo dicendogli anche quanti elementi sto aggiungento (qt)
            let categoryInVisual = {nameCategory: element.category, numberOfProducts: element.qt, products: new Array(element) };
            this.visualRecepit.push(categoryInVisual);
        } 

        //ora aggiorno il prezzo:
        this.totalPrice += (element.price * element.qt);
    }

    //dato un prodotto dalla sua categoria e la sua posizione in quella categoria, lo elimina
    deleteSingleProduct(categoryKey,pos){
        //individuo la category
        let categoryObj = this.visualRecepit.find((categoryObj)=>{ if (categoryObj.nameCategory == categoryKey) return categoryObj});
        if(categoryObj.products[pos].qt > 1){ //se la tipologia di prodotto che voglio eliminare ha più prodotti diminuisco la quantità  
            categoryObj.products[pos].qt--; 
            categoryObj.numberOfProducts--; //anche nella sua categoria

            //poi gestisco il prezzo
            this.totalPrice -= (categoryObj.products[pos].price);
        }else{ //altrimenti 
            if(categoryObj.products.length > 1){ //se dentro la categoria ci sono altre tipologia cancello solo quella che voglio cancellare
                //prima gestisco il prezzo
                this.totalPrice -=  (categoryObj.products[pos].price);
                //poi faccio il resto
                categoryObj.products.splice(pos,1);
            }
            else{  //altrimenti cancello tutta la categoria
                let numCat = this.visualRecepit.indexOf(categoryObj);//individuo la categoria da cancellare completamente in visualReceipt
                this.visualRecepit.splice(numCat, 1);
                this.totalPrice -=  (categoryObj.products[pos].price);   
            }
        }
    }

    //ritorna il numero dei prodotti presenti in una sola categoria
    getNumberOfProducts(categoryKey){
        return "metodo non ancora fatto";
    }

    getAllProducts(){
        return this.visualRecepit;
    }

    getVisualReceipt(){
        return new Array( this.totalPrice ,this.visualRecepit);
    }

    getVisualReceipt1(){
        let ris = [];
        let i=0;
        this.arrayCategories.forEach(element => {
            ris[i] = { nameCategory: element, products: this.getProductToCategory(element)}
            i++;
        });
        return ris;
    }

    getProductToCategory(categoryKey){
        let ris = [];
        if (typeof categoryKey === 'string')
            ris = this.products.filter((element)=>{ if (element.category == categoryKey) return element});
        else console.error("Param category isn't String");
        return ris;
    }

    getReceipt(){
        return this;
    }
        

}

class ReceiptsManager{
    constructor(){
        this.receipts = [];
        this.actualReceipts = "";
        this.actualNumberOfProducts = 0;
    }

    setReceipt(){
        if(typeof this.receipts != 'string' )
            this.receipts.push(this.receipts)
        this.actualReceipts = new Receipt(menu);
    }

    load(loadString,actualMenu){
        this.actualReceipts = new Receipt(actualMenu);
    }

    getActualReceipt(){
        return this.actualReceipts.getVisualReceipt();
    }

    //dato un prodotto lo aggiunge
    addProduct(element, qt =1){
        //id: id 'name': name, 'category': category, 'price': price, 'ingredients': ingredients
        this.actualReceipts.addProduct(element,qt);
        this.actualNumberOfProducts ++;
    }

    //dato un prodotto dalla sua categoria e la sua posizione in quella categoria, lo elimina
    deleteSingleProduct(category,pos){
        this.actualReceipts.deleteSingleProduct(category,pos);
    }

}

/* r = new Receipt();
r.addProduct({'name': 'cocacola', 'category': 'bibite', 'price': '2', 'ingredients': []});
r.addProduct({'name': 'cocacola', 'category': 'bibite', 'price': '2', 'ingredients': []});
r.addProduct({'name': 'pepsi', 'category': 'bibite', 'price': '2', 'ingredients': []});
r.addProduct({'name': 'hot-Dog', 'category': 'panino', 'price': '2', 'ingredients': []});
r.addProduct({'name': 'p_sasliccia', 'category': 'panino', 'price': '2', 'ingredients': []}); */

