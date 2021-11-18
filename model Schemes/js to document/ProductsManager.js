/* class Product{
    constructor(name,type,price){
        this.name = name;
        this.category = type;
        this.price = price;
        this.ingeredients = [];
    }
} */

class Menu{
    constructor(id,name,description="", products=[]){
        if(typeof id === undefined && typeof name === undefined){
            console.error("Cannot create a menu with empty id or name from param");
/*             process.exit(1); */
        }
        else{
            this.id = id;
            this.name = name;
            this.description = description;
            this.products = [];
            this.arrayCategories = [];
            products.forEach(element => {
                this.addProduct(element);
            });           
        }

    }

    loadProducts(jsonString){
        try {
            let products = JSON.parse(jsonString.trim());
            if(Array.isArray(products))
                products.forEach(element => {
                    this.addProduct(element.name,element.category,element.price,element.ingredients);
                }); 
            else console.error(jsonString);           
        } catch (error) {
            console.error(error);
        }
    }

    addProduct(element){
        /* let elements = new Product(name,category,price,ingredients); */
        /* let element ={ 'name': name, 'category': category, 'price': price, 'ingeredients': ingredients}; */
        this.products.push(element);
        //se non c'è la categoria del prodotto in questione allora l'aggiungi nelle categorie
        if ( !(this.arrayCategories.includes(element.category)) ) { 
            this.arrayCategories.push(element.category);
        }
    }

    getCategories(){
        return this.arrayCategories;
    }

    getProducts(){
        return this.products;
    }
}

class ProductsManager{
    constructor()
    {
        this.actualMenu = undefined;
        this.arrayMenu = [];
    }

    getNumberOfMenu(){
        return this.arrayMenu.length;
    }
    
    getMenu(key){
        let menuRis;
        if(typeof key === 'number')
            menuRis = this.arrayMenu.find((element)=>{ if (element.id   == key)return element});
        else if (typeof key === 'string')
            menuRis = this.arrayMenu.find((element)=>{ if (element.name == key) return element});
        else console.error("Param Key isn't String or Number");
        
        if(menuRis !== undefined)
            return menuRis;
        else return "il menu cercato non esiste";
    }

    getMenus(){
        return this.arrayMenu;
    }

    getCategories(idMenu){
        let menusearch = this.getMenu(idMenu);
        if(typeof menusearch === 'string')
            return menusearch;
        return menusearch.getCategories();
    }

    getProducts(idMenu){
        let menusearch = this.getMenu(idMenu);
        if(typeof menusearch === 'string')
            return menusearch;
        return menusearch.getProducts();
    }

    setActualMenu(number){
        this.actualMenu = numebr;

    }

    addMenu(id,name, description, products){
        let menu = new Menu(id,name,description,products);
        this.arrayMenu.push(menu);
    }

    loadMenus(jsonString){
        try {
            let menus = JSON.parse(jsonString.trim());
            if(Array.isArray(menus))
                menus.forEach(element => {
                    this.addMenu(this.getNumberOfMenu(),element.name, element.description, element.products);
                }); 
            else console.error(jsonString);           
        } catch (error) {
            console.error(error);
        }
    }
}