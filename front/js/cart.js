import {API_URL} from "./data.js";

const itemsDOM = document.querySelector('#cart__items')
const totalPriceDOM = document.querySelector('#totalPrice')
const totalQuantityDOM = document.querySelector('#totalQuantity')
const form = document.querySelector('form')

// Il est préférable d'écouter la soumission du formulaire plutôt que le clic sur un bouton
form.addEventListener('submit', onSubmitForm)

// Les données stockées du panier
let cart = getCartProducts()

// Les données complètes des produits du panier depuis l'API
// Pas besoin de récupérer les données de tous le produits du catalogue
// Normalement, une API bien faite permettrait de faire une requête
// avec une liste d'ids de produits pour récupérer seulement une partie du catalogue
let apiProductsData  = await getProductsDataFromApi(cart)

// On lance tout le traitement des données s'il y a qq'chose dans le panier
if(cart) {
    itemsDOM.innerHTML = ''
    cart.forEach(cartProduct => {
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

/**
 * Récupération des données des produits du panier
 * S'il y a dans le panier plusieurs fois le même produit,
 * ça ne sert à rien de retourner plusieurs fois les même infos
 * On retourne une promesse contenant un tableau des produits avec toutes leurs données
 * @param cart
 * @returns {Promise<Awaited<any>[]>}
 */
async function getProductsDataFromApi(cart) {
    if(!cart) {
        return []
    }
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
 * Retourne toutes les données d'un produit du panier
 * Données produit + couleur + quantité
 * @param product
 * @returns {unknown}
 */
function getProductFullData(product) {
    const fullProduct = apiProductsData.find(productData => productData._id === product.productId)
    return {
        ...fullProduct,
        ...product
    }
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
    const productData = getProductFullData(product)
    const article = document.createElement('article')
    article.classList.add('cart__item')
    article.dataset.id = productData.productId
    article.dataset.color = productData.color

    const innerArticleHTML = `
        <div class="cart__item__img">
            <img src="${productData.imagesUrls.medium}" alt="${productData.altTxt}">
        </div>
        <div class="cart__item__content">
            <div class="cart__item__content__description">
                <h2>${productData.name}</h2>
                <p>${productData.color}</p>
                <p>${productData.price.toLocaleString(undefined, {minimumFractionDigits: 2})} €</p>
            </div>
            <div class="cart__item__content__settings">
                <div class="cart__item__content__settings__quantity">
                    <p>Qté : </p>
                    <input type="number" class="itemQuantity" name="itemQuantity" min="1" max="100" value="${productData.quantity}">
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
    const total = cart.reduce((acc, product) => {
        const productData = getProductFullData(product)
        return acc + productData.quantity * productData.price
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
    const total = cart.reduce((acc, product) => {
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

    // Mise à jour du panier avec la nouvelle quantité
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
    // Suppression de la ligne du DOM
    article.remove()

    // Mise à jour de l'objet cart en enlevant le produit supprimé
    cart = cart.filter(cartItem => {
        return !(productId === cartItem.productId && productColor === cartItem.color)
    })

    // Maj du local storage avec le panier mis à jour
    setCartToLocalStorage(cart)
    //Maj du DOM
    setTotalPrice()
    setTotalQuantity()
}

/**
 * Toutes les infos concernant les champs du form sont ici
 * C'est pratique d'avoir toit au même endroit
 * @returns {{firstName: {messageErrorContainerId: string, errorsMessages: {format: string, required: string}, format: RegExp}, lastName: {messageErrorContainerId: string, errorsMessages: {format: string, required: string}, format: RegExp}, address: {messageErrorContainerId: string, errorsMessages: {format: string, required: string}, format: RegExp}, city: {messageErrorContainerId: string, errorsMessages: {format: string, required: string}, format: RegExp}, email: {messageErrorContainerId: string, errorsMessages: {format: string, required: string}, format: RegExp}}}
 */
function getFieldsDefinitions() {
    return {
        firstName: {
            format: /[\p{Letter}\p{Separator}\p{Dash_Punctuation}]{3,50}/u,
            messageErrorContainerId: 'firstNameErrorMsg',
            errorsMessages: {
                required: 'Prénom requis',
                format: 'Le prénom doit être compris entre 3 et 50 caractères et ne peut pas contenir de chiffres'
            }
        },
        lastName: {
            format: /[\p{Letter}\p{Separator}\p{Dash_Punctuation}]{3,50}/u,
            messageErrorContainerId: 'lastNameErrorMsg',
            errorsMessages: {
                required: 'Nom requis',
                format: 'Le prénom doit être compris entre 3 et 50 caractères et ne peut pas contenir de chiffres'
            }
        },
        address: {
            format: /^[\p{Letter}\p{Separator}\p{Punctuation}\d]{3,100}$/u,
            messageErrorContainerId: 'addressErrorMsg',
            errorsMessages: {
                required: 'Adresse requise',
                format: 'L\'adresse doit être comprise entre 3 et 100 caractères alphanumérique'
            }
        },
        city: {
            format: /^[\w\s,.-]{3,100}$/,
            messageErrorContainerId: 'cityErrorMsg',
            errorsMessages: {
                required: 'Ville requise',
                format: 'La ville doit être comprise entre 3 et 100 caractères alphanumérique'
            }
        },
        email: {
            format: /^[0-9a-z_\-.]{1,100}@[0-9a-z\-_.]{1,50}.[a-z]{2,5}$/,
            messageErrorContainerId: 'emailErrorMsg',
            errorsMessages: {
                required: 'Email requis',
                format: 'Adresse email invalide'
            }
        },
    }
}

/**
 * Validation du formulaire
 * Toute la logique se fait ici
 * On retourne un booléen success que l'on peut tester ensuite
 * Si pas d'erreurs, on renvoie les données du form
 * @param form
 * @returns {{success: boolean}}
 */
function formValidate(form) {
    const response = {
        success: true
    }
    const userValues = Object.fromEntries(new FormData(form))
    const fieldsDefinitions = getFieldsDefinitions()
    //On vérifie si tous les champs sont bien présents
    const isAllFieldsExists = Object.keys(fieldsDefinitions).every(key => {
        return Object.keys(userValues).includes(key)
    })
    if(!isAllFieldsExists) {
        console.log('champs manquants');
    }
    for (const userValueKey in userValues) {
        if(!fieldsDefinitions[userValueKey]) {
            continue
        }
        const fieldValue = userValues[userValueKey]
        const errorContainer = form.querySelector('#' + fieldsDefinitions[userValueKey].messageErrorContainerId)
        // Champ vide
        if(fieldValue === '' && fieldsDefinitions[userValueKey]) {
            response.success = false
            errorContainer.textContent = fieldsDefinitions[userValueKey].errorsMessages.required
        }
        // Mauvais format
        else if(!fieldsDefinitions[userValueKey].format.test(fieldValue)) {
            errorContainer.textContent = fieldsDefinitions[userValueKey].errorsMessages.format
        }
        // Enfin, si pas d'erreur, on supprime le contenu des erreurs et on envoie les données
        else {
            errorContainer.textContent = ''
            response.formData = userValues
        }
    }
    return response
}

/**
 * À la soumission du formulaire
 * @param ev
 * @returns {Promise<void>}
 */
async function onSubmitForm(ev) {
    ev.preventDefault()
    const validation = formValidate(form)
    if(!validation.success) {
        return
    }
    const response = await fetch(API_URL + '/order', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contact: validation.formData,
            products: cart.map(product => product.productId)
        })
    }).catch(error => {
        console.log('error', error);
    })

    if(response.ok) {
        const result = await response.json()
        location.href = './confirmation.html?orderId=' + result.orderId
        // suppression des produits du panier
        setCartToLocalStorage(cart)
    } else {
        const json = await response.json()
        console.log('json error', json);
    }
}
