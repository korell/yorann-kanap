import {API_URL} from "./data.js";

const itemsDOM = document.querySelector('#cart__items')
const totalPriceDOM = document.querySelector('#totalPrice')
const totalQuantityDOM = document.querySelector('#totalQuantity')
const form = document.querySelector('form')

let cartFullProducts
let apiProductsData
let cart = getCartProducts()

// On lance tout le traitement des données s'il y a qq'chose dans le panier
if(cart) {
    const productsData = await getProductsDataFromApi(cart)
    apiProductsData = productsData
    cartFullProducts = getCartProductsFullData(cart, productsData)
    itemsDOM.innerHTML = ''
    cartFullProducts.forEach(cartProduct => {
        const cartLineElement = buildProductLine(cartProduct)
        itemsDOM.append(cartLineElement)
    })

    setTotalPrice()
    setTotalQuantity()

    //gestion de la suppression d'un produit du panier
    const deleteButtons = itemsDOM.querySelectorAll('.deleteItem')
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', onClickDeleteButton)
    })

    //gestion de la mise à jour de la quantité d'un produit
    const quantityInputs = itemsDOM.querySelectorAll('.itemQuantity')
    quantityInputs.forEach(quantityInput => {
        quantityInput.addEventListener('change', onChangeItemQuantity)
    })
} else {
    itemsDOM.innerHTML = '<div>Panier vide</div>'
}

form.addEventListener('submit', onSubmitForm)

/**
 * Récupération des données des produits du panier
 * S'il y a dans le panier plusieurs fois le même produit,
 * ça ne sert à rien de retourner plusieurs fois les même infos
 * On retourne une promesse contenant un tableau des produits avec toutes leurs données
 * @param cart
 * @returns {Promise<Awaited<any>[]>}
 */
async function getProductsDataFromApi(cart) {
    const productsCartIds = cart.map(cart => cart.productId)

    // Set est une manière de dédupliquer des valeurs d'un tableau
    // Pour ensuite convertir ton Set en tableau tu peux utiliser le système de rest
    //const uniqProductsCartIds = [...new Set(productsCartIds)]

    // ou alors la méthode Array.from() qui prend un itérable en paramètre
    const uniqProductsCartIds = Array.from(new Set(productsCartIds))

    // Ici il faut utiliser un système de Promise.all() car .map() va renvoyer un tableau de promesses
    // Chacune de ces promesses contient comme résultat le détail d'un produit
    return Promise.all(
        uniqProductsCartIds.map(productCartId => {
            return getOneProductDataFromApi(productCartId)
        })
    )
}

/**
 * Retourne les données détaillées d'un produit
 * @param productId
 * @returns {Promise<any>}
 */
async function getOneProductDataFromApi(productId) {
    const response = await fetch(API_URL + '/' + productId)
    return await response.json()
}

/**
 * Récupération des données complètes des produits du panier
 * @param cart
 * @param productsData
 * @returns {*[]}
 */
function getCartProductsFullData(cart, productsData) {
    const products = []
    if(cart.length) {
        cart.forEach(cartItem => {
            const fullProduct = productsData.find(productData => productData._id === cartItem.productId)
            // Ici on complète le tableau avec les données du panier et des produits
            products.push({
                ...fullProduct,
                ...cartItem
            })
        })
    }
    return products
}

/**
 * Récupération des données du panier depuis le localStorage
 * @returns {any}
 */
function getCartProducts() {
    return JSON.parse(localStorage.getItem('cart'))
}

/**
 * Création du HTML d'une ligne produit du panier
 * @param product
 * @returns {HTMLElement}
 */
function buildProductLine(product) {
    const article = document.createElement('article')
    article.classList.add('cart__item')
    article.dataset.id = product.productId
    article.dataset.color = product.color

    const innerArticleHTML = `
        <div class="cart__item__img">
            <img src="${product.imagesUrls.medium}" alt="${product.altTxt}">
        </div>
        <div class="cart__item__content">
            <div class="cart__item__content__description">
                <h2>${product.name}</h2>
                <p>${product.color}</p>
                <p>${product.price.toLocaleString(undefined, {minimumFractionDigits: 2})} €</p>
            </div>
            <div class="cart__item__content__settings">
                <div class="cart__item__content__settings__quantity">
                    <p>Qté : </p>
                    <input type="number" class="itemQuantity" name="itemQuantity" min="1" max="100" value="${product.quantity}">
                </div>
                <div class="cart__item__content__settings__delete">
                    <button type="button" class="deleteItem">Supprimer</button>
                </div>
            </div>
        </div>
    `

    article.innerHTML = innerArticleHTML

    return article
}

/**
 * Enregistrement du panier en localStorage
 * @param cart
 */
function setCartToLocalStorage(cart) {
    if(cart.length) {
        localStorage.setItem('cart', JSON.stringify(cart))
    } else {
        localStorage.removeItem('cart')
    }
}

/**
 * Mise à jour du prix total dans le DOM
 */
function setTotalPrice() {

    // La méthode .reduce() est très utile pour faire des sommes
    const total = cartFullProducts.reduce((acc, product) => {
        return acc + product.quantity * product.price
    }, 0)
    totalPriceDOM.textContent = total.toLocaleString(
        undefined, {
            minimumFractionDigits: 2
        })
}

/**
 * Mise à jour de la quantité totale dans le DOM
 */
function setTotalQuantity() {
    const total = cartFullProducts.reduce((acc, product) => {
        return acc + parseInt(product.quantity)
    }, 0)
    totalQuantityDOM.textContent = total
}

/**
 * Quand on modifie la quantité d'un produit
 * @param ev
 */
function onChangeItemQuantity(ev) {
    const article = ev.target.closest('[data-id]')
    const productId = article.dataset.id
    const productColor = article.dataset.color
    const newQuantity = ev.target.value
    cartFullProducts = cartFullProducts.map(cartFullProduct => {
        if(cartFullProduct.productId === productId && cartFullProduct.color === productColor) {
            cartFullProduct.quantity = parseInt(newQuantity)
        }
        return cartFullProduct
    })
    cart = cart.map(cartItem => {
        if(cartItem.productId === productId && cartItem.color === productColor) {
            cartItem.quantity = parseInt(newQuantity)
        }
        return cartItem
    })
    setCartToLocalStorage(cart)
    setTotalQuantity()
    setTotalPrice()
}

/**
 * Actions lors de la suppression d'un produit
 * @param ev
 */
function onClickDeleteButton(ev) {
    const article = ev.target.closest('[data-id]')
    const productId = article.dataset.id
    const productColor = article.dataset.color
    // Suppression du DOM
    article.remove()

    // Mise à jour de l'objet cart en enlevant le produit supprimé
    cart = cart.filter(cartItem => {
        return !(productId === cartItem.productId && productColor === cartItem.color)
    })

    // Mise à jour de notre objet contenant toutes les données
    cartFullProducts = cartFullProducts.filter(cartItem => {
        return !(productId === cartItem.productId && productColor === cartItem.color)
    })

    // Maj du local storage avec le panier mis à jour
    setCartToLocalStorage(cart)
    //Maj du DOM
    setTotalPrice()
    setTotalQuantity()
}

/**
 * À la soumission du formulaire
 * @param ev
 * @returns {Promise<void>}
 */
async function onSubmitForm(ev) {
    ev.preventDefault()
    const contact = Object.fromEntries(new FormData(form))
    const response = await fetch(API_URL + '/order', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contact: contact,
            products: cartFullProducts.map(product => product._id)
        })
    }).catch(error => {
        console.log('error', error);
    })

    if(response.ok) {
        const result = await response.json()
        location.href = './confirmation.html?orderId=' + result.orderId
        // suppression des produits du panier
        cart = []
        setCartToLocalStorage(cart)
    } else {
        const json = await response.json()
        console.log('json error', json);
    }
}
