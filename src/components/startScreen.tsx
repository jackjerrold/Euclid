import Logo from "./Logo";


export default function StartScreen({ onOpen }: { onOpen: (p: string) => void }) {
  return(
    <main className="start">
        <section className="start-left">  
          <div className="start-brand">
            <Logo />   
            <div className="brand-name">EUCLID</div>
          </div>
        </section> 
        <section className="start-right">
          Recent Projects
        </section>
    </main>
  )
}


