import {API_URL} from "./data.js";

let product

const url = new URL(location.href)
const productId = url.searchParams.get('id')
const colorsSelectDOM = document.querySelector('#colors')
const descriptionDOM = document.querySelector('#description')
const priceDOM = document.querySelector('#price')
const quantityDOM = document.querySelector('#quantity')
const imageContainerDOM = document.querySelector('.item__img')
const addToCartButton = document.querySelector('#addToCart')

/**
 * Récupération des données produit depuis l'API
 * @param productId
 * @returns {Promise<any>}
 */
async function getProduct(productId) {
    const response = await fetch(API_URL + '/' + productId)
    return await response.json()
}

/**
 * Mise à jour des données produit dans le DOM
 * @param productData
 */
function setProductDOMData(productData) {
    productData.colors.forEach(color => {
        colorsSelectDOM.append(new Option(color, color))
    })
    const img = new Image()
    img.src = productData.imageUrl
    img.alt = productData.altTxt
    imageContainerDOM.append(img)
    descriptionDOM.innerHTML = productData.description
    priceDOM.innerHTML = productData.price
    document.title = productData.name
}

/**
 * Action lors du clic sur le bouton d'ajout au panier
 */
function onClickAddToCartButton() {
    const itemToCart = {
        productId: product._id
    }

    if(colorsSelectDOM.value) {
        itemToCart.color = colorsSelectDOM.value
    }

    if(quantityDOM.value > 0) {
        itemToCart.quantity = parseInt(quantityDOM.value)
    }

    if(itemToCart.color && itemToCart.quantity) {
        setItemToCart(itemToCart)

        const addMessage = document.createElement('div')
        addMessage.textContent = `${itemToCart.quantity} ${product.name} ajouté !`

        addMessage.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px;
            background-color: black;
            color: white;
        `
        document.body.append(addMessage)
        
        // suppression du message après 2s (2000ms)
        setTimeout(() => {
            addMessage.remove()
        }, 2000)
    }
}

/**
 * Mise à jour du panier dans le local storage
 * @param item
 */
function setItemToCart(item) {
    let cart = []
    if(localStorage.getItem('cart')) {
        cart = JSON.parse(localStorage.getItem('cart'))
    }
    // vérification de la présence du produit dans le panier
    const productInCart = cart.find(product => product.productId === item.productId && product.color === item.color)
    if(productInCart) {
        // si présent on incrémente la quantité
        productInCart.quantity = parseInt(item.quantity) + parseInt(productInCart.quantity)
    } else {
        cart.push(item)
    }
    localStorage.setItem('cart', JSON.stringify(cart))
}

getProduct(productId).then(productData => {
    product = productData
    setProductDOMData(productData)
})

addToCartButton.addEventListener('click', onClickAddToCartButton)


