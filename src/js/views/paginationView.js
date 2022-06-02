import View from './View.js';
import icons from 'url:../../img/icons.svg';

class PaginationView extends View {
  _parentElement = document.querySelector('.pagination');
  _generateMarkup() {
    const numPages = Math.ceil(
      this._data.results.length / this._data.resultsPerPage
    );
    const curPage = this._data.page;

    // Page 1 and there are otherpages
    if (curPage === 1 && numPages > 1) {
      return this._generateMarkupButton('next', 'right', curPage + 1);
    }

    // Last Page
    if (curPage === numPages && numPages > 1) {
      return this._generateMarkupButton('prev', 'left', curPage - 1);
    }
    // Other Page
    if (curPage > 1 && curPage < numPages) {
      return (
        this._generateMarkupButton('prev', 'left', curPage - 1) +
        this._generateMarkupButton('next', 'right', curPage + 1)
      );
    }
    // Page 1, and no other pages
    return '';
  }

  _generateMarkupButton(prevOrNext, leftOrRight, gotoPage) {
    return `
       <button data-goto="${gotoPage}" class="btn--inline pagination__btn--${prevOrNext}">
            <svg class="search__icon">
              <use href="${icons}#icon-arrow-${leftOrRight}"></use>
            </svg>
            <span>Page ${gotoPage}</span>
        </button>`;
  }

  addhandlerClick(handler) {
    this._parentElement.addEventListener('click', function (e) {
      const btn = e.target.closest('.btn--inline'); //mais proximo elemento pai que possui a classe btn-inline
      if (!btn) return;

      const goToPage = +btn.dataset.goto;

      handler(goToPage);
    });
  }
}

export default new PaginationView();
