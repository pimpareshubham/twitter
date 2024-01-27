import React from 'react'
import Sidebar from '../components/Sidebar'
import Feed from '../components/Feed'

export default function Home() {
    return (
        <div className='d-flex flex-row'>
            <Sidebar className="col-12" />
            <Feed className="col-12"/>
        </div>
    )
}
