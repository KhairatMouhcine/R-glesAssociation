# 🌟 Algorithme Apriori — Visualisation interactive du Treillis complet des itemsets  
👨‍💻 *Développé par [Khairat Mouhcine](https://github.com/kurombo)*  

[![Made with JavaScript](https://img.shields.io/badge/Made%20with-JavaScript-yellow?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/fr/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-orange?style=for-the-badge&logo=html5)](https://developer.mozilla.org/fr/docs/Web/Guide/HTML/HTML5)
[![CSS3](https://img.shields.io/badge/CSS3-blue?style=for-the-badge&logo=css3)](https://developer.mozilla.org/fr/docs/Web/CSS)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Data Mining](https://img.shields.io/badge/Data%20Mining-Apriori%20Algorithm-purple?style=for-the-badge&logo=apachespark)](#)

> 🧮 Une application web interactive et colorée pour comprendre visuellement l’**algorithme Apriori**.  
> Elle permet de **générer le treillis complet des itemsets**, de **calculer les niveaux fréquents (Lk/Ck)** et de **produire automatiquement les règles d’association** avec support, confiance et lift 📊.

---

## 🚀 Fonctionnalités principales

### 🌲 1. Génération du Treillis complet
- Visualisation **zoomable et interactive** des itemsets sous forme d’arbre.
- Chaque nœud représente un **ensemble d’items** `{A, B, C}`.
- Les arêtes montrent les **relations de sous-ensembles**.
- Sélection intelligente : survol ou clic pour afficher **parents** et **enfants** 🔁.

### 🧮 2. Calcul du support — Algorithme Apriori
- Entrée d’un **min_support** et d’un **maxK** (taille maximale des itemsets).
- Calcul et affichage automatiques des niveaux :
  - `Ck` → candidats  
  - `Lk` → itemsets fréquents ✅  
- Coloration des ensembles valides / invalides 🔴🟢.  
- Résumé final : dernier `Lk` fréquent, support absolu et relatif.

### 🧠 3. Génération des règles d’association
- Création de toutes les règles `X ⇒ Y` à partir du dernier niveau fréquent.
- Calcul de :
  - **Support (s)**
  - **Confiance (α)**
  - **Lift (amélioration)**
- Mise en valeur de la **meilleure règle** (fond vert 💚).
- Affichage du nombre théorique de règles :  
  `R = 3^d - 2^(d+1) + 1`

---

## 🧑‍💻 Utilisation

### 1️⃣ Cloner ou télécharger le projet :
```bash
git clone https://github.com/kurombo/R-glesAssociation.git
cd R-glesAssociation
