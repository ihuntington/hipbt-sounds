import qs from 'query-string'

class SoundsIframe {
    constructor(track) {
        this.frame = document.createElement('iframe')
        this.frame.name = 'hipbt-bookmarklet-frame'
        this.frame.width = 1
        this.frame.height = 1
        this.frame.referrerPolicy = 'strict-origin-when-cross-origin'
        this.frame.addEventListener('load', this.handleLoad.bind(this), {
            once: true
        })
        this.frame.addEventListener('error', this.handleError.bind(this), {
            once: true,
        })

    }

    add(track) {
        const query = qs.stringify(track)
        this.frame.src = `http://localhost:8080/bookmarklet/save?${query}`
        document.body.appendChild(this.frame);
        return this;
    }

    handleLoad(event) {

    }

    handleError(event) {

    }
}
