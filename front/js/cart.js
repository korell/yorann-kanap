import {API_URL} from "./data.js";

const itemsDOM = document.querySelector('#cart__items')
const totalPriceDOM = document.querySelector('#totalPrice')
const totalQuantityDOM = document.querySelector('#totalQuantity')
const form = document.querySelector('form')
const formSubmitBtn = form.querySelector('#order')

let cartFullProducts
let apiProductsData

let cart = getCartProducts()

if(cart) {
    getProductsDataFromApi(cart).then(productsData => {
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
    })
} else {
    itemsDOM.innerHTML = '<div>Panier vide</div>'
}

form.addEventListener('submit', onSubmitForm)

async function getProductsDataFromApi(cart) {
    const productsCartIds = cart.map(cart => cart.productId)
    const uniqProductsCartIds = [...new Set(productsCartIds)]
    return Promise.all(
        uniqProductsCartIds.map(productCartId => {
            return getOneProductDataFromApi(productCartId)
        })
    )
}

async function getOneProductDataFromApi(productId) {
    const response = await fetch(API_URL + '/' + productId)
    return await response.json()
}

function getCartProductsFullData(cart, productsData) {
    const products = []
    if(cart.length) {
        cart.forEach(cartItem => {
            const fullProduct = productsData.find(productData => productData._id === cartItem.productId)
            products.push({
                ...fullProduct,
                ...cartItem
            })
        })
    }
    return products
}
function getCartProducts() {
    return JSON.parse(localStorage.getItem('cart'))
}
function buildProductLine(product) {
    const article = document.createElement('article')
    article.classList.add('cart__item')
    article.dataset.id = product.productId
    article.dataset.color = product.color

    const innerArticleHTML = `
        <div class="cart__item__img">
            <img src="${product.imageUrl}" alt="${product.altTxt}">
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

function setCartToLocalStorage(cart) {
    if(cart.length) {
        localStorage.setItem('cart', JSON.stringify(cart))
    } else {
        localStorage.removeItem('cart')
    }
}

function setTotalPrice() {
    const total = cartFullProducts.reduce((acc, product) => {
        return acc + product.quantity * product.price
    }, 0)
    totalPriceDOM.textContent = total.toLocaleString(
        undefined, {
            minimumFractionDigits: 2
        })
}
function setTotalQuantity() {
    const total = cartFullProducts.reduce((acc, product) => {
        return acc + parseInt(product.quantity)
    }, 0)
    totalQuantityDOM.textContent = total
}

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

function onClickDeleteButton(ev) {
    const article = ev.target.closest('[data-id]')
    const productId = article.dataset.id
    const productColor = article.dataset.color
    article.remove()
    cart = cart.filter(cartItem => {
        return !(productId === cartItem.productId && productColor === cartItem.color)
    })
    cartFullProducts = cartFullProducts.filter(cartItem => {
        return !(productId === cartItem.productId && productColor === cartItem.color)
    })
    setCartToLocalStorage(cart)
    setTotalPrice()
    setTotalQuantity()
}

function onSubmitForm(ev) {
    ev.preventDefault()
    const contact = Object.fromEntries(new FormData(form))
    fetch(API_URL + '/order', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contact: contact,
            products: cartFullProducts.map(product => product._id)
        })
    }).then(response => {
        if(response.ok) {
            response.json().then(result => {
                location.href = './confirmation.html?orderId=' + result.orderId
            })
        } else {
            response.json().then(json => {
                console.log('json error', json);
            })
        }
    }).catch(error => {
        console.log('error', error);
    })
}
