import React, {Fragment} from 'react'

function Paginate(props) {

    const paginator =  props.paginator || {}
    const total_pages =  paginator.total_pages || 1
    const current_page =  paginator.current_page || 1
    const next_page_url =  paginator.next_page_url 
    const previous_page_url =  paginator.previous_page_url 


    var paginationPages = []
    for (let i = 1; i <= total_pages; i++) {
        paginationPages.push(i)
    }

    function onClickPage (e, page) {
        e.preventDefault();
        
        props.pagechanged(page)
    }


    return (
        <Fragment>
             <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="float-left">
                Showing {paginator?.current_page==1 ? 1 : (paginator?.current_page-1)*paginator?.record_per_page+1} to {paginator?.current_page==1 ? paginator?.current_page_items_count : (paginator?.current_page-1)*paginator?.record_per_page+paginator?.current_page_items_count} of {paginator?.total_count} entries
            </div>

            <nav aria-label="Page navigation example float-right" >
                <ul className="pagination float-right">

                    <li className={`page-item ${previous_page_url ? '':'disabled' }`}>
                        <a href="#0" className="page-link" onClick={ (e) => onClickPage(e, 1)} aria-label="First page" title="First page">
                            <i className="fa fa-fast-backward"></i>
                        </a>
                    </li>

                    <li  className={`page-item ${previous_page_url ? '':'disabled' }`}>
                        <a href="#0" className="page-link"  onClick={ (e) => onClickPage(e, current_page - 1)} aria-label="Previous" title="Previous page">
                            <span aria-hidden="true">&laquo;</span>
                            <span className="sr-only">Previous</span>
                        </a>
                    </li>


                    {
                        paginator?.current_page > 3 ?
                        <li className="page-item">
                            <a className="page-link" href="#0" onClick={ (e) => onClickPage(e, 1)}
                            title={'Go to page 1'}
                            >1</a>
                        </li>
                        : null
                    }

                    {
                        paginator?.current_page > 4?
                        <li className="mx-1"><span>...</span></li>
                        : null
                    }

                    

                    {
                        (Array.from({length: paginator?.total_pages}, (_, i) => i + 1))?.map((pageNumber)=> (
                             (pageNumber >= (paginator?.current_page - 2) && pageNumber <= (paginator?.current_page + 2)) ?
                                (pageNumber == paginator?.current_page) ?
                                    <li className={`page-item ${(paginator?.current_page == pageNumber) ? ' active' : ''}`} key={'paginate-'+pageNumber}>
                                        <a  className="page-link" 
                                            onClick={ (e) => onClickPage(e, pageNumber)}
                                            title={'Go to page '+pageNumber}
                                            href="#0"
                                        >{ pageNumber }</a>
                                    </li>
                                :
                                    <li  key={'paginate-1-'+pageNumber}>
                                        <a  className="page-link"  href="#0"
                                            onClick={ (e) => onClickPage(e, pageNumber)}
                                            title={'Go to page '+pageNumber}
                                        >{pageNumber}</a></li>
                                
                            :null
                        )
                                         

                        )
                    }


                    {
                        paginator?.current_page < paginator?.pagination_last_page - 3 ?
                        <li className="mx-1"><span>...</span></li>
                        : null
                    }

                    <li className={`page-item ${next_page_url ? '':'disabled' }`}>
                        <a href="#0" className="page-link" onClick={ (e) => onClickPage(e, current_page + 1)} aria-label="Next" title="Next page">
                            <span aria-hidden="true">&raquo;</span>
                            <span className="sr-only">Next</span>
                        </a>
                    </li>


                    <li className={`page-item ${next_page_url ? '':'disabled' }`}>
                        <a href="#0" className="page-link" onClick={ (e) => onClickPage(e, total_pages)} aria-label="Last page" title="Last page">
                            <i className="fa fa-fast-forward"></i>
                        </a>
                    </li>
                    
                </ul>
            </nav>
            </div>
        </Fragment>
    )
}

export default Paginate
