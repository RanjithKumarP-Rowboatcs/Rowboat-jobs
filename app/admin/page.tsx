'use client'
import {FormEvent,useEffect,useState} from 'react'
import RowboatLogo from '../../components/RowboatLogo'
import TalentDatabase2 from '../../components/TalentDatabase2'
import {createClient} from '../../lib/supabase/browser'

const emptyJob={title:'',company:'',module:'SAP',industry:'Information Technology',location:'',experience:'',type:'Full-time',openings:1,salary:'',description:'',requirements:'',responsibilities:'',skills:'',apply_email:'Hello@rowboatcs.com',reference_code:'',status:'draft'}
export default function AdminPage(){