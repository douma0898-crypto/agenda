from flask import request, current_app


def paginate(query):
    """Aplica paginação a uma query SQLAlchemy a partir dos query params `page` e `per_page`."""
    try:
        page = max(int(request.args.get("page", 1)), 1)
    except (TypeError, ValueError):
        page = 1

    default_size = current_app.config.get("DEFAULT_PAGE_SIZE", 20)
    max_size = current_app.config.get("MAX_PAGE_SIZE", 100)
    try:
        per_page = int(request.args.get("perPage", default_size))
    except (TypeError, ValueError):
        per_page = default_size
    per_page = min(max(per_page, 1), max_size)

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    meta = {
        "page": pagination.page,
        "perPage": pagination.per_page,
        "totalItems": pagination.total,
        "totalPages": pagination.pages,
        "hasNext": pagination.has_next,
        "hasPrev": pagination.has_prev,
    }
    return pagination.items, meta
