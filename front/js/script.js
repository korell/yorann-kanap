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

/**
 * On construit ici la partie HTML d'une carte produit
 * @param productData
 * @returns {HTMLAnchorElement} : l'élément lien cliquable
 */
function buildProductCard(productData) {
    const productElement = document.createElement('a')
    productElement.href = `./product.html?id=${productData._id}`
    productElement.innerHTML = `
        <article>
            <img src="${productData.imagesUrls.small}" alt="${productData.altTxt}">
            <h3 class="productName">${productData.name}</h3>
            <p class="productDescription">${productData.description}</p>
        </article>
    `
    return productElement
}

/**
 * Insertion des cartes produits dans le container HTML
 * @param products
 */
function insertProducts(products) {
    productsItemsContainer.innerHTML = ''
    products.forEach(product => {
        const productElement = buildProductCard(product)
        productsItemsContainer.append(productElement)
    })
}

// Éxécution du processus d'ajout des produits dans le DOM
const products = await getProducts()
insertProducts(products)

