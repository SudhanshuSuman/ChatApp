const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $shareLocationButton = document.querySelector('#share-location-button')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Query String
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})

socket.on('roomDetails', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

const autoScroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild
    
    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messeges container
    const containerHeight = $messages.scrollHeight

    // How far is the it scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const messageHTML = Mustache.render(messageTemplate, {
        sentAt: dayjs(message.sentAt).format('hh:mm A'),
        username: message.username,
        message: message.message
    })
    $messages.insertAdjacentHTML('beforeend', messageHTML)
    autoScroll()
})

socket.on('locationMessage', (locationMessage) => {
    console.log(locationMessage)
    const locationHTML = Mustache.render(locationTemplate, {
        sentAt: dayjs(locationMessage.sentAt).format('hh:mm A'),
        username: locationMessage.username,
        locationURL: locationMessage.url
    })
    $messages.insertAdjacentHTML('beforeend', locationHTML)
    autoScroll()
})

$messageFormInput.focus()
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (error) => {

        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.focus()

        if(error) {
            return console.log(error)
        }

        $messageFormInput.value = ''
        console.log('Message Delivered')
    })
})

$shareLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Your browser does not support location sharing!')
    }

    $shareLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {

        $shareLocationButton.removeAttribute('disabled')
        $messageFormInput.focus()

        socket.emit('shareLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (error) => {
            if(error) {
                console.log(error)
            }
            console.log('Location shared!')
        })
    })
})