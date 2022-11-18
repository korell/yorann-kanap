import {API_URL} from "./data.js";

const productsItemsContainer = document.querySelector('#items')

/**
 * Fonction de récupération des produits depuis l'API
 * @returns {Promise<any>}
 */
async function getProducts() {
    const response = await fetch(API_URL)
    return await response.json()
}

function buildProductCard(productData) {
    const productElement = document.createElement('a')
    productElement.href = `./product.html?id=${productData._id}`
    productElement.innerHTML = `
        <article>
            <img src="${productData.imageUrl}" alt="${productData.altTxt}">
            <h3 class="productName">${productData.name}</h3>
            <p class="productDescription">${productData.description}</p>
        </article>
    `
    return productElement
}

function insertProducts(products) {
    productsItemsContainer.innerHTML = ''
    products.forEach(product => {
        const productElement = buildProductCard(product)
        productsItemsContainer.append(productElement)
    })
}

getProducts().then(products => {
    insertProducts(products)
})

